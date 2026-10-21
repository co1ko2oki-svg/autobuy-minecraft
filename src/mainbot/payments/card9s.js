const crypto = require('crypto');
const config = require('../config/config');

async function sendCard(telco, amount, serial, pin, requestId) {
    try {
        const partnerId = config.card9sPartnerId;
        const partnerKey = config.card9sPartnerKey;
        const url = config.card9sApiUrl;

        if (!partnerId || !partnerKey) {
            return { success: false, message: 'Chưa cấu hình API Thẻ Cào' };
        }

        const sign = crypto.createHash('md5').update(partnerKey + pin + serial).digest('hex');

        const queryParams = new URLSearchParams({
            request_id: requestId,
            partner_id: partnerId,
            telco: telco,
            amount: amount,
            serial: serial,
            code: pin,
            sign: sign,
            command: 'charging'
        }).toString();

        const fullUrl = `${url}?${queryParams}`;
        const response = await fetch(fullUrl, { method: 'GET' });
        
        if (!response.ok) {
            return { success: false, message: `Lỗi kết nối API: ${response.statusText}` };
        }

        const data = await response.json();
        
        if (data.status === 99 || data.status === 1 || data.status === 'pending') {
            return { success: true, message: 'Đã gửi thẻ lên hệ thống thành công!' };
        }
        return { success: false, message: data.message || 'Thẻ bị từ chối' };
    } catch (e) {
        console.error('[Card9s] Lỗi khi gửi thẻ cào:', e.message);
        return { success: false, message: 'Lỗi hệ thống khi gửi thẻ.' };
    }
}

async function checkCardStatus(requestId) {
    try {
        const partnerId = config.card9sPartnerId;
        const partnerKey = config.card9sPartnerKey;
        const url = config.card9sApiUrl;
        
        const sign = crypto.createHash('md5').update(partnerKey + requestId).digest('hex');

        const queryParams = new URLSearchParams({
            request_id: requestId,
            partner_id: partnerId,
            sign: sign,
            command: 'check'
        }).toString();

        const response = await fetch(`${url}?${queryParams}`, { method: 'GET' });
        
        if (!response.ok) {
            return { status: 'error', message: 'Lỗi API' };
        }

        const data = await response.json();

        if (data.status === 1) {
            return { status: 'success', realAmount: data.value || data.amount }; 
        } else if (data.status === 99 || data.status === 'pending') {
            return { status: 'pending' };
        } else {
            return { status: 'failed', message: data.message || 'Thẻ sai hoặc đã được sử dụng.' };
        }
    } catch (e) {
        console.error('[Card9s] Lỗi kiểm tra trạng thái thẻ:', e.message);
        return { status: 'error', message: 'Lỗi hệ thống.' };
    }
}

module.exports = {
    sendCard,
    checkCardStatus
};
