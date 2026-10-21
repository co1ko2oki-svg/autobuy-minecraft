const axios = require('axios');
const db = require('../database/db');
require('dotenv').config();

let transactionsCache = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 10000;

function generateQRUrl(amount, content) {
    const bankId = process.env.BANK_ID;
    const bankAccount = process.env.BANK_ACCOUNT_NUMBER;
    const accountName = encodeURIComponent(process.env.BANK_ACCOUNT_NAME);
    const memo = encodeURIComponent(content);

    return `https://img.vietqr.io/image/${bankId}-${bankAccount}-qr_only.png?amount=${amount}&addInfo=${memo}&accountName=${accountName}`;
}

async function getSePayTransactions() {
    try {
        const now = Date.now();
        if (transactionsCache && (now - lastFetchTime < CACHE_DURATION_MS)) {
            return transactionsCache;
        }

        const apiKey = process.env.SEPAY_API_KEY;
        if (!apiKey) {
            console.error('[SePay] Thiếu SEPAY_API_KEY trong cấu hình');
            return null;
        }

        const response = await axios.get('https://my.sepay.vn/userapi/transactions/list', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.transactions) {
            transactionsCache = response.data.transactions;
            lastFetchTime = Date.now();
            return transactionsCache;
        }
        return [];
    } catch (error) {
        console.error('[SePay] Lỗi lấy danh sách giao dịch:', error.response ? error.response.data : error.message);
        return null;
    }
}

async function checkSePayTransaction(amount, content, transactionsList = null) {
    try {
        let transactions = transactionsList;

        if (!transactions) {
            transactions = await getSePayTransactions();
        }

        if (transactions && Array.isArray(transactions)) {
            const upperContent = (content || '').toUpperCase();
            for (const tx of transactions) {
                const txId = String(tx.id);
                
                if (db.readDB().processedSepay && db.readDB().processedSepay.has(txId)) {
                    continue;
                }

                const txAmount = parseInt(tx.amount_in, 10);
                const txContent = tx.transaction_content ? tx.transaction_content.toUpperCase() : '';

                if (txAmount >= amount && txContent.includes(upperContent)) {
                    db.insertProcessedSepay({
                        id: txId,
                        amount_in: txAmount,
                        transaction_content: txContent
                    });
                    return true;
                }
            }
        }
        return false;
    } catch (error) {
        console.error('[SePay] Lỗi kiểm tra giao dịch:', error.message);
        return false;
    }
}

module.exports = {
    generateQRUrl,
    checkSePayTransaction,
    getSePayTransactions
};
