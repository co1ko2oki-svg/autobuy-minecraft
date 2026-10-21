const crypto = require('crypto');

function generateInvoiceId() {
    return 'INV' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

function generatePaymentContent() {
    return 'MC' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

function normalizeKey(rawKey) {
    return rawKey
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[_\-\s]+/g, ' ')
        .trim();
}

const KEY_MAP = {
    'username': 'Username',
    'user': 'Username',
    'ign': 'Username',
    'owns mc': 'Owns MC',
    'ownsmc': 'Owns MC',
    'capes': 'Capes',
    'cape': 'Capes',
    'rank': 'Rank',
    'recovery code': 'Recovery Code',
    'recoverycode': 'Recovery Code',
    'primary email': 'Primary Email',
    'primaryemail': 'Primary Email',
    'email': 'Primary Email',
    'security email': 'Security Email',
    'securityemail': 'Security Email',
    'secret key': 'Secret Key',
    'secretkey': 'Secret Key',
    'password': 'Password',
    'pass': 'Password',
    'gia': 'Giá',
    'price': 'Giá',
    'mau card': 'Mẫu Card',
    'card style': 'Mẫu Card',
    'card': 'Mẫu Card',
    'style': 'Mẫu Card'
};

function parseAccountsFromFile(fileContent) {
    const lines = fileContent.split(/\r?\n/);
    const accounts = [];
    let currentAccount = {};

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
            if (Object.keys(currentAccount).length > 0) {
                if (currentAccount['Username'] && currentAccount['Giá'] !== undefined && currentAccount['Giá'] !== null) {
                    accounts.push({ ...currentAccount });
                }
                currentAccount = {};
            }
            continue;
        }

        const splitIndex = line.indexOf(':');
        if (splitIndex !== -1) {
            const rawKey = line.substring(0, splitIndex).trim();
            const value = line.substring(splitIndex + 1).trim();
            const normalized = normalizeKey(rawKey);
            const standardKey = KEY_MAP[normalized];

            if (standardKey) {
                if (standardKey === 'Giá') {
                    currentAccount[standardKey] = normalizePrice(value);
                } else {
                    currentAccount[standardKey] = value;
                }
            }
        }
    }

    if (Object.keys(currentAccount).length > 0) {
        if (currentAccount['Username'] && currentAccount['Giá'] !== undefined && currentAccount['Giá'] !== null) {
            accounts.push({ ...currentAccount });
        }
    }

    return accounts;
}

function normalizePrice(price) {
    if (typeof price === 'number') return Math.floor(price);
    if (price == null) return 0;

    let str = String(price).trim().toLowerCase();

    // Loại bỏ từ chỉ đơn vị tiền tệ trước khi kiểm tra k / m
    str = str.replace(/(vnđ|vnd|đồng|dong|đ)/g, '').trim();

    let multiplier = 1;
    if (/[km]$/.test(str)) {
        multiplier = str.endsWith('m') ? 1000000 : 1000;
        str = str.slice(0, -1).trim();
    }

    str = str.replace(/[^\d.,]/g, '');
    if (!str) return 0;

    const hasComma = str.includes(',');
    const hasDot = str.includes('.');

    if (hasComma && hasDot) {
        if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
            str = str.replace(/\./g, '').replace(/,/g, '.');
        } else {
            str = str.replace(/,/g, '');
        }
    } else if (hasComma) {
        if (/^\d{1,3}(,\d{3})+$/.test(str)) str = str.replace(/,/g, '');
        else str = str.replace(/,/g, '.');
    } else if (hasDot) {
        if (/^\d{1,3}(\.\d{3})+$/.test(str)) str = str.replace(/\./g, '');
    }

    const value = parseFloat(str);
    if (isNaN(value)) return 0;
    return Math.floor(value * multiplier);
}

module.exports = {
    generateInvoiceId,
    generatePaymentContent,
    parseAccountsFromFile,
    normalizePrice
};
