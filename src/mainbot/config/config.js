require('dotenv').config();

function getString(key, defaultValue = '') {
    const val = process.env[key];
    if (val === undefined || val === null || val === '') return defaultValue;
    return String(val).trim();
}

function getArray(key, defaultValue = []) {
    const val = process.env[key];
    if (!val) return defaultValue;
    return val.split(',').map(s => s.trim()).filter(Boolean);
}

function getNumber(key, defaultValue = 0) {
    const val = process.env[key];
    if (!val) return defaultValue;
    const num = parseInt(val, 10);
    return isNaN(num) ? defaultValue : num;
}

module.exports = {
    // Discord & Auth
    token: getString('DISCORD_TOKEN'),
    clientId: getString('CLIENT_ID'),
    adminIds: getArray('ADMIN_IDS'),
    masterServerId: getString('GUILD_ID') || getString('MAIN_GUILD_ID') || getString('MASTER_SERVER_ID'),
    mainGuildId: getString('GUILD_ID') || getString('MAIN_GUILD_ID') || getString('MASTER_SERVER_ID'),
    mainServerInvite: getString('MAIN_SERVER_INVITE'),

    // Ngân hàng & SePay
    bankId: getString('BANK_ID', 'MBbank'),
    bankAccountNumber: getString('BANK_ACCOUNT_NUMBER'),
    bankAccountName: getString('BANK_ACCOUNT_NAME'),
    sepayApiKey: getString('SEPAY_API_KEY'),
    sepayAccountNumber: getString('SEPAY_ACCOUNT_NUMBER') || getString('BANK_ACCOUNT_NUMBER'),

    // Cổng PayOS (chạy song song)
    payosClientId: getString('PAYOS_CLIENT_ID'),
    payosApiKey: getString('PAYOS_API_KEY'),
    payosChecksumKey: getString('PAYOS_CHECKSUM_KEY'),

    // Cổng thẻ cào Card9s
    card9sPartnerId: getString('CARD9S_PARTNER_ID'),
    card9sPartnerKey: getString('CARD9S_PARTNER_KEY'),
    card9sApiUrl: getString('CARD9S_API_URL', 'https://card9s.com/chargingws/v2'),

    // Kênh & Danh mục Discord
    stockCategoryIds: getArray('STOCK_CATEGORY_ID'),
    ticketCategoryIds: getArray('TICKET_CATEGORY_ID'),
    logChannelIds: getArray('LOG_CHANNEL_ID'),
    legitChannelIds: getArray('LEGIT_CHANNEL_ID'),
    inputChannelIds: getArray('INPUT_CHANNEL_ID'),
    receivedAccountsChannelId: getString('RECEIVED_ACCOUNTS_CHANNEL_ID'),

    // Hệ thống Vai trò (Roles)
    buyerRoleIds: getArray('BUYER_ROLE_ID'),
    pingRoleIds: getArray('PING_ROLE_ID'),
    role100kIds: getArray('ROLE_100K_ID'),
    role500kIds: getArray('ROLE_500K_ID'),
    roleVipIds: getArray('ROLE_VIP_ID'),

    // Cài đặt đơn hàng
    invoiceTimeoutMinutes: getNumber('INVOICE_TIMEOUT_MINUTES', 10),

    // Minecraft Stats & Banner
    hypixelApiKey: getString('HYPIXEL_API_KEY'),
    donutApiKey: getString('DONUT_API_KEY'),
    leaderboardChannelId: getString('LEADERBOARD_CHANNEL_ID'),
    leaderboardBannerUrl: getString('LEADERBOARD_BANNER_URL'),

    // Màu sắc Embed
    colors: {
        success: '#2ecc71',
        danger: '#e74c3c',
        primary: '#3498db',
        warning: '#f1c40f'
    }
};
