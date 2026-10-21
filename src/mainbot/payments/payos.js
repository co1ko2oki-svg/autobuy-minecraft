const { PayOS } = require('@payos/node');
require('dotenv').config();

let payosClient = null;

function getPayOS() {
    const clientId = process.env.PAYOS_CLIENT_ID;
    const apiKey = process.env.PAYOS_API_KEY;
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

    if (!clientId || !apiKey || !checksumKey) {
        return null;
    }

    if (!payosClient) {
        try {
            payosClient = new PayOS({
                clientId,
                apiKey,
                checksumKey
            });
        } catch (e) {
            console.error('[PayOS] Khởi tạo client thất bại:', e.message);
            return null;
        }
    }
    return payosClient;
}

function isPayOSEnabled() {
    return Boolean(process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY);
}

function generateOrderCode() {
    const timestampPart = Math.floor(Date.now() / 1000);
    const randomPart = Math.floor(Math.random() * 900) + 100;
    return parseInt(`${timestampPart}${randomPart}`.slice(-9), 10);
}

async function createPayOSPayment({ orderCode, amount, description }) {
    const payos = getPayOS();
    if (!payos) return null;

    try {
        const cleanDesc = (description || `DH${orderCode}`).slice(0, 25);
        const paymentData = {
            orderCode: Number(orderCode),
            amount: Number(amount),
            description: cleanDesc,
            cancelUrl: process.env.PAYOS_CANCEL_URL || 'https://discord.com',
            returnUrl: process.env.PAYOS_RETURN_URL || 'https://discord.com'
        };

        const paymentLink = await payos.paymentRequests.create(paymentData);
        return paymentLink;
    } catch (error) {
        console.error('[PayOS] Lỗi tạo link thanh toán:', error.message);
        return null;
    }
}

async function checkPayOSTransaction(orderCode) {
    const payos = getPayOS();
    if (!payos || !orderCode) return false;

    try {
        const order = await payos.paymentRequests.get(Number(orderCode));
        if (order && (order.status === 'PAID' || order.status === 'COMPLETED')) {
            return true;
        }
        return false;
    } catch (error) {
        if (!error.message?.includes('404') && !error.message?.includes('not found')) {
            console.error('[PayOS] Lỗi tra cứu giao dịch:', error.message);
        }
        return false;
    }
}

async function cancelPayOSPayment(orderCode, reason = 'Đơn hàng bị hủy') {
    const payos = getPayOS();
    if (!payos || !orderCode) return null;

    try {
        return await payos.paymentRequests.cancel(Number(orderCode), reason);
    } catch (error) {
        console.warn(`[PayOS] Không thể hủy payment request ${orderCode}:`, error.message);
        return null;
    }
}

module.exports = {
    getPayOS,
    isPayOSEnabled,
    generateOrderCode,
    createPayOSPayment,
    checkPayOSTransaction,
    cancelPayOSPayment
};
