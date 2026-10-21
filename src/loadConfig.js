const fs = require('fs');
const path = require('path');

require('dotenv').config();

const configPath = path.join(__dirname, '..', 'config.json');
if (fs.existsSync(configPath)) {
    try {
        const json = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        for (const [key, value] of Object.entries(json)) {
            if (value === null || value === undefined) continue;
            const strVal = Array.isArray(value) ? value.join(',') : String(value).trim();
            if (strVal !== '' || !process.env[key]) {
                process.env[key] = strVal;
            }
        }
    } catch (e) {
        console.error('[Config] Lỗi đọc config.json:', e.message);
    }
}

function printSetupReport() {
    const mask = (str, len = 6) => (!str ? 'Chưa cấu hình' : (str.length > len ? str.slice(0, len) + '...' : str));
    const status = (val) => (val && String(val).trim() !== '' ? '✅' : '❌');

    console.log('\n==================================================');
    console.log('       THẬP CẨM STORE - AUTOBUY MINECRAFT BOT      ');
    console.log('==================================================');
    console.log(`[Bot] Token: ${process.env.DISCORD_TOKEN ? '✅ ' + mask(process.env.DISCORD_TOKEN, 10) : '❌ THIẾU DISCORD_TOKEN'}`);
    console.log(`[Bot] Client ID: ${process.env.CLIENT_ID || 'Chưa điền'}`);
    console.log(`[Bot] Server ID: ${process.env.GUILD_ID || process.env.MAIN_GUILD_ID || 'Chưa điền'}`);
    console.log(`[Bot] Admin IDs: ${process.env.ADMIN_IDS || 'Chưa điền'}`);

    console.log('--------------------------------------------------');
    console.log(`[Kênh] Danh mục Stock:  ${status(process.env.STOCK_CATEGORY_ID)} ${process.env.STOCK_CATEGORY_ID || 'Thiếu'}`);
    console.log(`[Kênh] Danh mục Ticket: ${status(process.env.TICKET_CATEGORY_ID)} ${process.env.TICKET_CATEGORY_ID || 'Thiếu'}`);
    console.log(`[Kênh] Kênh Log Bill:   ${status(process.env.LOG_CHANNEL_ID)} ${process.env.LOG_CHANNEL_ID || 'Thiếu'}`);
    console.log(`[Kênh] Kênh Nhập Hàng:  ${status(process.env.INPUT_CHANNEL_ID)} ${process.env.INPUT_CHANNEL_ID || 'Thiếu'}`);
    console.log(`[Kênh] Kênh Legit:      ${status(process.env.LEGIT_CHANNEL_ID)} ${process.env.LEGIT_CHANNEL_ID || 'Thiếu'}`);

    console.log('--------------------------------------------------');
    console.log(`[Bank] Ngân Hàng: ${process.env.BANK_ID || 'Chưa cấu hình'} - STK: ${process.env.BANK_ACCOUNT_NUMBER || 'Chưa cấu hình'} (${process.env.BANK_ACCOUNT_NAME || 'Tên chủ TK'})`);

    const hasSepay = Boolean(process.env.SEPAY_API_KEY);
    const hasPayos = Boolean(process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY);
    const hasCard = Boolean(process.env.CARD9S_PARTNER_ID && process.env.CARD9S_PARTNER_KEY);

    console.log(`[Cổng Thanh Toán]:`);
    console.log(` - SePay (Bank):   ${hasSepay ? '✅ Đang BẬT' : '⚪ TẮT (Thiếu SEPAY_API_KEY)'}`);
    console.log(` - PayOS (Bank):   ${hasPayos ? '✅ Đang BẬT (Chạy song song)' : '⚪ TẮT (Chưa điền đủ 3 key PayOS)'}`);
    console.log(` - Card9s (Thẻ):   ${hasCard ? '✅ Đang BẬT' : '⚪ TẮT (Chưa điền Partner ID/Key)'}`);
    console.log('==================================================\n');

    if (!process.env.DISCORD_TOKEN) {
        console.error('⚠️ [CẢNH BÁO] Chưa có DISCORD_TOKEN trong .env hoặc config.json! Bot sẽ không thể khởi động.\n');
    }
}

printSetupReport();

module.exports = {
    printSetupReport
};
