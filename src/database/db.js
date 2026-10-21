const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const dbDir = __dirname;
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.run('PRAGMA journal_mode = WAL;');
db.run('PRAGMA busy_timeout = 10000;');
db.run('PRAGMA synchronous = NORMAL;');

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}



db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS accounts (
        _id TEXT PRIMARY KEY,
        username TEXT,
        ownsMC TEXT,
        capes TEXT,
        rank TEXT,
        recoveryCode TEXT,
        primaryEmail TEXT,
        securityEmail TEXT,
        secretKey TEXT,
        password TEXT,
        price TEXT,
        isSold INTEGER DEFAULT 0,
        soldTo TEXT,
        soldAt TEXT,
        createdAt TEXT,
        stockChannelId TEXT,
        stockMessageId TEXT,
        lockUser TEXT,
        lockExpiresAt TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        accountId TEXT,
        guildId TEXT,
        channelId TEXT,
        messageId TEXT,
        FOREIGN KEY(accountId) REFERENCES accounts(_id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS invoices (
        invoiceId TEXT PRIMARY KEY,
        userId TEXT,
        channelId TEXT,
        amount INTEGER,
        content TEXT,
        accountId TEXT,
        status TEXT,
        createdAt TEXT,
        expiresAt TEXT,
        card_request_id TEXT,
        card_amount INTEGER,
        payos_order_code INTEGER,
        payos_checkout_url TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        userId TEXT,
        totalSpent INTEGER DEFAULT 0,
        totalBought INTEGER DEFAULT 0,
        purchaseHistory TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS processed_sepay (
        txId TEXT PRIMARY KEY,
        amount INTEGER,
        content TEXT,
        processedAt TEXT
    )`);

    const migrations = [
        ['accounts', 'lockUser TEXT'],
        ['accounts', 'lockExpiresAt TEXT'],
        ['invoices', 'payos_order_code INTEGER'],
        ['invoices', 'payos_checkout_url TEXT']
    ];
    for (const [table, colDef] of migrations) {
        db.run(`ALTER TABLE ${table} ADD COLUMN ${colDef}`, () => {});
    }
});

let cache = {
    accounts: new Map(),
    invoices: new Map(),
    users: new Map(),
    processedSepay: new Set()
};

function loadDBToCache() {
    return (async () => {
        const [accounts, posts, invoices, users, processed] = await Promise.all([
            all(`SELECT * FROM accounts`),
            all(`SELECT * FROM posts`),
            all(`SELECT * FROM invoices`),
            all(`SELECT * FROM users`),
            all(`SELECT * FROM processed_sepay`)
        ]);

        cache.accounts.clear();
        (accounts || []).forEach(acc => {
            const accPosts = (posts || []).filter(p => p.accountId === acc._id);
            cache.accounts.set(acc._id, {
                ...acc,
                isSold: acc.isSold === 1,
                posts: accPosts
            });
        });

        cache.invoices.clear();
        (invoices || []).forEach(inv => {
            cache.invoices.set(inv.invoiceId, { ...inv, id: inv.invoiceId });
        });

        cache.users.clear();
        (users || []).forEach(u => {
            let history = [];
            try {
                history = u.purchaseHistory ? JSON.parse(u.purchaseHistory) : [];
            } catch (e) {
                history = [];
            }
            cache.users.set(u.id || u.userId, { ...u, purchaseHistory: history });
        });

        cache.processedSepay.clear();
        (processed || []).forEach(p => cache.processedSepay.add(p.txId));

        console.log('[Database] Dữ liệu SQLite đã được nạp vào bộ nhớ');
    })();
}

function readDB() {
    return cache;
}

function insertAccount(account) {
    const isSoldInt = account.isSold ? 1 : 0;

    run(
        `INSERT INTO accounts (_id, username, ownsMC, capes, rank, recoveryCode, primaryEmail, securityEmail, secretKey, password, price, isSold, soldTo, soldAt, createdAt, stockChannelId, stockMessageId, lockUser, lockExpiresAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            account._id, account.username, account.ownsMC, account.capes, account.rank,
            account.recoveryCode, account.primaryEmail, account.securityEmail, account.secretKey,
            account.password, account.price, isSoldInt, account.soldTo, account.soldAt,
            account.createdAt, account.stockChannelId, account.stockMessageId,
            account.lockUser || null, account.lockExpiresAt || null
        ]
    ).catch(err => console.error('[SQLite] Lỗi insert account:', err.message));

    if (account.posts && account.posts.length > 0) {
        for (const post of account.posts) {
            run(`INSERT INTO posts (accountId, guildId, channelId, messageId) VALUES (?, ?, ?, ?)`,
                [account._id, post.guildId, post.channelId, post.messageId]
            ).catch(err => console.error('[SQLite] Lỗi insert post:', err.message));
        }
    }

    cache.accounts.set(account._id, account);
}

function updateAccount(accountIdOrObj, updates = {}) {
    const accountId = typeof accountIdOrObj === 'string' ? accountIdOrObj : accountIdOrObj._id;
    const actualUpdates = typeof accountIdOrObj === 'string' ? updates : accountIdOrObj;

    const account = cache.accounts.get(accountId);
    if (!account) return;

    Object.assign(account, actualUpdates);
    const updatedAcc = account;
    const isSoldInt = updatedAcc.isSold ? 1 : 0;

    run(
        `UPDATE accounts SET 
            username = ?, ownsMC = ?, capes = ?, rank = ?, recoveryCode = ?, 
            primaryEmail = ?, securityEmail = ?, secretKey = ?, password = ?, 
            price = ?, isSold = ?, soldTo = ?, soldAt = ?, 
            stockChannelId = ?, stockMessageId = ?,
            lockUser = ?, lockExpiresAt = ?
         WHERE _id = ?`,
        [
            updatedAcc.username, updatedAcc.ownsMC, updatedAcc.capes, updatedAcc.rank, updatedAcc.recoveryCode,
            updatedAcc.primaryEmail, updatedAcc.securityEmail, updatedAcc.secretKey, updatedAcc.password,
            updatedAcc.price, isSoldInt, updatedAcc.soldTo, updatedAcc.soldAt,
            updatedAcc.stockChannelId, updatedAcc.stockMessageId,
            updatedAcc.lockUser || null, updatedAcc.lockExpiresAt || null, accountId
        ]
    ).catch(err => console.error('[SQLite] Lỗi update account:', err.message));
}

function deleteAccount(accountId) {
    cache.accounts.delete(accountId);

    run(`DELETE FROM posts WHERE accountId = ?`, [accountId])
        .then(() => run(`DELETE FROM accounts WHERE _id = ?`, [accountId]))
        .catch(err => console.error('[SQLite] Lỗi delete account:', err.message));
}

async function tryLockAccount(accountId, userId, ttlMs = 120000) {
    const nowIso = new Date().toISOString();
    const expiresIso = new Date(Date.now() + ttlMs).toISOString();

    try {
        const result = await run(
            `UPDATE accounts SET lockUser = ?, lockExpiresAt = ?
             WHERE _id = ?
               AND isSold = 0
               AND (lockUser IS NULL OR lockExpiresAt IS NULL OR lockExpiresAt <= ?)`,
            [userId, expiresIso, accountId, nowIso]
        );

        if (result.changes === 1) {
            const acc = cache.accounts.get(accountId);
            if (acc) {
                acc.lockUser = userId;
                acc.lockExpiresAt = expiresIso;
            }
            return { acquired: true, lockUser: userId };
        }

        const acc = cache.accounts.get(accountId);
        return { acquired: false, lockUser: acc ? acc.lockUser : null };
    } catch (err) {
        console.error('[SQLite] Lỗi tryLockAccount:', err.message);
        return { acquired: false, lockUser: null };
    }
}

async function unlockAccount(accountId, userId) {
    try {
        await run(
            `UPDATE accounts SET lockUser = NULL, lockExpiresAt = NULL
             WHERE _id = ? AND (lockUser IS NULL OR lockUser = ?)`,
            [accountId, userId]
        );
        const acc = cache.accounts.get(accountId);
        if (acc) {
            acc.lockUser = null;
            acc.lockExpiresAt = null;
        }
    } catch (err) {
        console.error('[SQLite] Lỗi unlockAccount:', err.message);
    }
}

function generateId() {
    return crypto.randomBytes(6).toString('hex');
}

function insertInvoice(invoice) {
    const invId = invoice.invoiceId || invoice.id;
    invoice.invoiceId = invId;
    invoice.id = invId;

    run(
        `INSERT OR REPLACE INTO invoices (invoiceId, userId, channelId, amount, content, accountId, status, createdAt, expiresAt, card_request_id, card_amount, payos_order_code, payos_checkout_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            invoice.invoiceId, invoice.userId, invoice.channelId, invoice.amount, invoice.content,
            invoice.accountId, invoice.status, invoice.createdAt, invoice.expiresAt,
            invoice.card_request_id || null, invoice.card_amount || null,
            invoice.payos_order_code || null, invoice.payos_checkout_url || null
        ]
    ).catch(err => console.error('[SQLite] Lỗi insert invoice:', err.message));

    cache.invoices.set(invId, invoice);
}

function updateInvoice(invoice) {
    const invId = invoice.invoiceId || invoice.id;
    invoice.invoiceId = invId;
    invoice.id = invId;

    run(
        `UPDATE invoices SET status = ?, channelId = ?, amount = ?, expiresAt = ?, card_request_id = ?, card_amount = ?, payos_order_code = ?, payos_checkout_url = ? WHERE invoiceId = ?`,
        [invoice.status, invoice.channelId, invoice.amount, invoice.expiresAt, invoice.card_request_id || null, invoice.card_amount || null, invoice.payos_order_code || null, invoice.payos_checkout_url || null, invId]
    ).catch(err => console.error('[SQLite] Lỗi update invoice:', err.message));

    cache.invoices.set(invId, invoice);
}

function deleteInvoice(invoiceId) {
    cache.invoices.delete(invoiceId);
    run(`DELETE FROM invoices WHERE invoiceId = ?`, [invoiceId])
        .catch(err => console.error('[SQLite] Lỗi delete invoice:', err.message));
}

function updateUser(userRecord) {
    const userId = userRecord.id || userRecord.userId;
    userRecord.id = userId;
    userRecord.userId = userId;
    const historyJson = JSON.stringify(userRecord.purchaseHistory || []);

    run(
        `INSERT OR REPLACE INTO users (id, userId, totalSpent, totalBought, purchaseHistory)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, userId, userRecord.totalSpent || 0, userRecord.totalBought || 0, historyJson]
    ).catch(err => console.error('[SQLite] Lỗi update user:', err.message));

    cache.users.set(userId, userRecord);
}

function insertProcessedSepay(tx) {
    const txId = String(tx.id);
    const date = new Date().toISOString();

    run(
        `INSERT OR IGNORE INTO processed_sepay (txId, amount, content, processedAt) VALUES (?, ?, ?, ?)`,
        [txId, tx.amount_in, tx.transaction_content, date]
    ).catch(err => console.error('[SQLite] Lỗi insert processed_sepay:', err.message));

    cache.processedSepay.add(txId);
}

module.exports = {
    loadDBToCache,
    readDB,
    insertAccount,
    updateAccount,
    deleteAccount,
    generateId,
    insertInvoice,
    updateInvoice,
    deleteInvoice,
    updateUser,
    insertProcessedSepay,
    tryLockAccount,
    unlockAccount
};
