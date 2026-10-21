const axios = require('axios');
const AssetLoader = require('./core/AssetLoader');
const RenderPipeline = require('./core/RenderPipeline');
const Logger = require('./core/Logger');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

async function fetchDonutSMPStats(username, donutApiKey) {
    if (donutApiKey) {
        try {
            const res = await axios.get(`https://api.donutsmp.net/v1/stats/${username}`, {
                headers: { 'Authorization': `Bearer ${donutApiKey}` }
            });
            if (res.data && res.data.result) {
                const data = res.data.result;
                const moneyNum = parseInt(data.money || 0);
                const formattedMoney = isNaN(moneyNum) ? '$0' : '$' + formatNumber(moneyNum);
                let playtimeStr = '0h';
                if (data.playtime) {
                    const playtimeMs = parseInt(data.playtime);
                    if (!isNaN(playtimeMs)) playtimeStr = Math.floor(playtimeMs / 3600000) + 'h';
                }
                return { playtime: playtimeStr, money: formattedMoney, shards: data.shards || '0' };
            }
        } catch (e) {
            Logger.warn('DonutSMP fetch failed');
        }
    }
    return { playtime: 'N/A', money: '0', shards: '0' };
}

function getNetworkLevel(networkExp) {
    const REVERSE_PQ_PREFIX = -3.5;
    const REVERSE_CONST = 12.25;
    const GROWTH_DIVIDES_2 = 0.0008;
    return networkExp < 0 ? 1 : Math.floor(1 + REVERSE_PQ_PREFIX + Math.sqrt(REVERSE_CONST + GROWTH_DIVIDES_2 * networkExp));
}

// Initializing fonts on startup
AssetLoader.initFonts();

try {
    const fontPath = path.join(__dirname, '../../fonts/MinecraftRegular.otf');
    if (fs.existsSync(fontPath)) registerFont(fontPath, { family: 'Minecraft' });
} catch (e) { }

async function safeLoadImage(imagePath) {
    try { return await loadImage(imagePath); } catch (e) { throw e; }
}

function drawText(ctx, text, x, y, font, color, align = 'left') {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
}

async function generatePlayerCard(accountData, hypixelApiKey, donutApiKey, cardStyle) {
    Logger.log('Starting card generation', { username: accountData.username, cardStyle });
    if (cardStyle != null) accountData.cardStyle = cardStyle;

    const username = accountData.username || 'Unknown';
    const rawCapes = accountData.capes ? accountData.capes.split(',').map(c => c.trim()).filter(c => c !== '') : [];
    accountData.parsedCapes = rawCapes;

    const dataPromises = [
        fetchDonutSMPStats(username, donutApiKey)
    ];

    let uuid = "";
    const apis = [`https://api.minetools.eu/uuid/${username}`, `https://playerdb.co/api/player/minecraft/${username}`];
    
    const fetchUuid = async () => {
        for (const api of apis) {
            try {
                const res = await axios.get(api);
                if (res.data && res.data.id) return res.data.id.replace(/-/g, '');
                if (res.data && res.data.data && res.data.data.player) return res.data.data.player.raw_id;
            } catch (e) { }
        }
        return username;
    };
    
    uuid = await fetchUuid();

    let hypixelStats = { level: 0, achievements: 0, karma: '0' };
    if (uuid && hypixelApiKey) {
        try {
            const hpRes = await axios.get(`https://api.hypixel.net/player?uuid=${uuid}`, {
                headers: { 'API-Key': hypixelApiKey }
            });
            if (hpRes.data && hpRes.data.success && hpRes.data.player) {
                const player = hpRes.data.player;
                hypixelStats.level = getNetworkLevel(player.networkExp || 0);
                hypixelStats.achievements = player.achievementPoints || 0;
                let karma = player.karma || 0;
                hypixelStats.karma = karma > 1000000 ? (karma/1000000).toFixed(1) + 'M' : (karma > 1000 ? (karma/1000).toFixed(1) + 'K' : karma.toString());
            }
        } catch (e) {
            Logger.warn('Hypixel API fetch failed');
        }
    }

    const [donutStats] = await Promise.all(dataPromises);

    const combinedStats = {
        level: hypixelStats.level,
        money: donutStats.money,
    };

    const [bgFrames, logos, skins, capes] = await Promise.all([
        AssetLoader.loadBackground(),
        AssetLoader.loadLogos(),
        AssetLoader.loadSkins(uuid !== username ? uuid : username),
        AssetLoader.loadCapes(rawCapes)
    ]);

    const assets = { bgFrames, logos, skins, capes };

    return await RenderPipeline.encodeGIF(accountData, combinedStats, assets);
}

async function generateInvoiceCard(invoice, qrUrl, accountData) {
    const canvasW = 1400;
    const canvasH = 700;
    const canvas = createCanvas(canvasW, canvasH);
    const ctx = canvas.getContext('2d');

    const bgDir = path.join(__dirname, '../../backgrounds');
    let bgImageObj = null;
    try {
        if (fs.existsSync(bgDir)) {
            const files = fs.readdirSync(bgDir).filter(f => f.match(/\.(png|jpe?g)$/i) && f !== '1.png' && f !== 'cyber_invoice.png');
            if (files.length > 0) {
                const randomFile = files[Math.floor(Math.random() * files.length)];
                bgImageObj = await safeLoadImage(path.join(bgDir, randomFile));
            }
        }
    } catch(e) {}

    if (bgImageObj) {
        ctx.drawImage(bgImageObj, 0, 0, canvasW, canvasH);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvasW, canvasH);
    } else {
        const bgGradient = ctx.createLinearGradient(0, 0, canvasW, canvasH);
        bgGradient.addColorStop(0, '#2a0a12');
        bgGradient.addColorStop(1, '#0a0204');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvasW, canvasH);

        const highlight = ctx.createRadialGradient(canvasW/2, canvasH/2, 0, canvasW/2, canvasH/2, 900);
        highlight.addColorStop(0, 'rgba(225, 29, 72, 0.08)');
        highlight.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = highlight;
        ctx.fillRect(0, 0, canvasW, canvasH);
    }

    const leftX = 120;
    const leftY = 120;

    drawText(ctx, accountData.username, leftX, leftY + 40, 'bold 48px "Segoe UI", "Inter", "Helvetica Neue", sans-serif', '#f8fafc');
    drawText(ctx, accountData.rank ? `Hạng: ${accountData.rank.toUpperCase()}` : 'Hạng: THƯỜNG', leftX, leftY + 80, '500 24px "Segoe UI", "Inter", sans-serif', '#cbd5e1');

    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(leftX, leftY + 110, 160, 36, 6);
    ctx.fill();
    ctx.stroke();
    drawText(ctx, 'CHỜ THANH TOÁN', leftX + 80, leftY + 134, 'bold 14px "Segoe UI", "Inter", sans-serif', '#fca5a5', 'center');

    let uuid = accountData.username;
    try {
        const res = await axios.get(`https://api.minetools.eu/uuid/${accountData.username}`);
        if (res.data && res.data.id) uuid = res.data.id.replace(/-/g, '');
    } catch (e) {}

    const skinW = 210;
    const skinH = 380;
    const skinX = leftX + 15;
    const skinY = leftY + 180;
    try {
        const skinImage = await safeLoadImage(`https://visage.surgeplay.com/full/512/${uuid}`);
        ctx.drawImage(skinImage, skinX, skinY, skinW, skinH);
    } catch (e) {
        try {
            const f = await safeLoadImage(`https://mc-heads.net/body/${uuid}/512.png`);
            ctx.drawImage(f, skinX, skinY, skinW, skinH);
        } catch (err) {}
    }

    const rightX = 540;
    const rightY = 90;
    const panelW = 760;
    const panelH = 580;

    ctx.fillStyle = 'rgba(30, 10, 15, 0.6)'; 
    ctx.strokeStyle = 'rgba(225, 29, 72, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(rightX, rightY, panelW, panelH, 16);
    ctx.fill();
    ctx.stroke();

    drawText(ctx, 'HÓA ĐƠN THANH TOÁN', rightX + 60, rightY + 70, 'bold 32px "Segoe UI", "Inter", sans-serif', '#f8fafc');
    drawText(ctx, `MÃ GIAO DỊCH: ${invoice.invoiceId}`, rightX + 60, rightY + 105, '18px "Segoe UI", "Inter", sans-serif', '#fecdd3'); 

    const qrSize = 280;
    const qrX = rightX + panelW - qrSize - 60; 
    const qrY = rightY + 130;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 12);
    ctx.fill();

    try {
        const qrImage = await safeLoadImage(qrUrl);
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
    } catch(e) {
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(qrX, qrY, qrSize, qrSize);
        drawText(ctx, 'LỖI TẢI QR', qrX + qrSize/2, qrY + qrSize/2, 'bold 20px "Segoe UI", sans-serif', '#ef4444', 'center');
    }

    const infoX = rightX + 60;
    let infoY = rightY + 160;
    const bankId = process.env.BANK_ID || 'MBbank';
    const bankAccount = process.env.BANK_ACCOUNT_NUMBER || 'N/A';
    const accountName = process.env.BANK_ACCOUNT_NAME || 'N/A';

    drawText(ctx, 'NGÂN HÀNG', infoX, infoY, '600 14px "Segoe UI", "Inter", sans-serif', '#fda4af');
    drawText(ctx, bankId, infoX, infoY + 28, 'bold 22px "Segoe UI", "Inter", sans-serif', '#ffffff');

    infoY += 75;
    drawText(ctx, 'SỐ TÀI KHOẢN', infoX, infoY, '600 14px "Segoe UI", "Inter", sans-serif', '#fda4af');
    drawText(ctx, bankAccount, infoX, infoY + 28, 'bold 22px "Segoe UI", "Inter", sans-serif', '#ffffff');

    infoY += 75;
    let displayName = accountName.length > 22 ? accountName.substring(0, 20) + '...' : accountName;
    drawText(ctx, 'CHỦ TÀI KHOẢN', infoX, infoY, '600 14px "Segoe UI", "Inter", sans-serif', '#fda4af');
    drawText(ctx, displayName, infoX, infoY + 28, 'bold 20px "Segoe UI", "Inter", sans-serif', '#ffffff');

    infoY += 70;
    const boxW = 340;
    const boxH = 150;
    ctx.fillStyle = 'rgba(225, 29, 72, 0.05)';
    ctx.strokeStyle = 'rgba(225, 29, 72, 0.2)';
    ctx.beginPath();
    ctx.roundRect(infoX, infoY, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    drawText(ctx, 'SỐ TIỀN', infoX + 25, infoY + 35, '600 14px "Segoe UI", "Inter", sans-serif', '#fda4af');
    drawText(ctx, `${invoice.amount.toLocaleString('vi-VN')} VNĐ`, infoX + 25, infoY + 65, 'bold 28px "Segoe UI", "Inter", sans-serif', '#fbbf24');

    drawText(ctx, 'NỘI DUNG CHUYỂN KHOẢN', infoX + 25, infoY + 105, '600 14px "Segoe UI", "Inter", sans-serif', '#fda4af');
    drawText(ctx, invoice.content, infoX + 25, infoY + 135, 'bold 28px "Segoe UI", "Inter", sans-serif', '#f43f5e');

    drawText(ctx, '* Bắt buộc nhập đúng nội dung chuyển khoản để hệ thống tự động xác nhận đơn', infoX, infoY + 175, 'italic 13px "Segoe UI", "Inter", sans-serif', '#fb7185');

    return canvas.toBuffer('image/png');
}

module.exports = {
    generatePlayerCard,
    generateInvoiceCard
};
