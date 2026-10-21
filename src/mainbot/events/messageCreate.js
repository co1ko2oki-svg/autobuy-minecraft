const { Events } = require('discord.js');
const config = require('../config/config');
const { readDB } = require('../database/db');
const { parseAccountsFromFile } = require('../utils/helpers');
const { processStockAccounts } = require('../utils/stockManager');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot || !message.guild) return;

        if (config.inputChannelIds?.includes(message.channel.id)) {
            const hasManageGuild = message.member && message.member.permissions.has('ManageGuild');
            const isAdminId = config.adminIds && config.adminIds.includes(message.author.id);
            const isBotOwner = process.env.BOT_ID === message.author.id;

            if (hasManageGuild || isAdminId || isBotOwner) {
                let contentText = message.content || '';
                const txtAttachment = message.attachments.find(a => a.name && a.name.endsWith('.txt'));
                if (txtAttachment) {
                    try {
                        const axios = require('axios');
                        const res = await axios.get(txtAttachment.url);
                        contentText = typeof res.data === 'string' ? res.data : String(res.data);
                    } catch (attErr) {
                        console.error('[InputChannel] Lỗi tải file đính kèm:', attErr.message);
                    }
                }

                message.delete().catch(() => {});

                const accounts = parseAccountsFromFile(contentText);
                if (accounts.length === 0) {
                    const statusMsg = await message.channel.send('❌ Định dạng sai. Vui lòng kiểm tra lại cấu trúc account (Cần có Username và Giá).');
                    setTimeout(() => statusMsg.delete().catch(() => {}), 10000);
                    return;
                }

                const statusMsg = await message.channel.send(`⏳ Đang xử lý đăng ${accounts.length} tài khoản...`);
                const result = await processStockAccounts(accounts, message.guild, message.author);

                await statusMsg.edit(result.message);
                setTimeout(() => statusMsg.delete().catch(() => {}), 10000);

                if (config.receivedAccountsChannelId) {
                    const receivedChannel = message.client.channels.cache.get(config.receivedAccountsChannelId);
                    if (receivedChannel) {
                        await receivedChannel.send({ content: `✅ Sao lưu danh sách **${accounts.length}** tài khoản do <@${message.author.id}> thêm lúc <t:${Math.floor(Date.now() / 1000)}:f>:` });
                        const chunkSize = 1900;
                        for (let i = 0; i < contentText.length; i += chunkSize) {
                            const chunk = contentText.substring(i, i + chunkSize);
                            await receivedChannel.send({ content: `\`\`\`yaml\n${chunk}\n\`\`\`` });
                        }
                    }
                }
            }
            return;
        }

        if (!config.legitChannelIds?.includes(message.channel.id)) return;

        const content = message.content.toLowerCase();
        const hasLegitKeyword = content.includes('legit') || content.includes('vouch');
        const sellerIds = new Set([
            ...(config.adminIds || []),
            ...(process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(s => s.trim()).filter(Boolean) : []),
            message.client.user.id,
            process.env.CLIENT_ID,
            process.env.BOT_ID
        ].filter(Boolean));
        const mentionsSeller = Array.from(sellerIds).some(id => id && (content.includes(id) || message.mentions.users.has(id)));

        if (!hasLegitKeyword || !mentionsSeller) return;

        let ticketChannel = null;

        try {
            const db = readDB();
            const userInvoices = Array.from(db.invoices.values()).filter(inv => inv.userId === message.author.id);
            for (const inv of userInvoices) {
                const channel = message.guild.channels.cache.get(inv.channelId);
                if (channel) {
                    ticketChannel = channel;
                    break;
                }
            }
        } catch (e) {
            console.error('[Legit] Lỗi kiểm tra ticket từ database:', e.message);
        }

        if (!ticketChannel) {
            ticketChannel = message.guild.channels.cache.find(c =>
                (c.name.includes('buy-') || c.name.includes('ticket') || (config.ticketCategoryIds && config.ticketCategoryIds.includes(c.parentId))) &&
                (c.permissionOverwrites.cache.has(message.author.id) || c.name.includes(message.author.username.toLowerCase()))
            );
        }

        if (!ticketChannel) {
            try {
                const fetchedChannels = await message.guild.channels.fetch();
                ticketChannel = fetchedChannels.find(c =>
                    (c.name.includes('buy-') || c.name.includes('ticket') || (config.ticketCategoryIds && config.ticketCategoryIds.includes(c.parentId))) &&
                    (c.permissionOverwrites.cache.has(message.author.id) || c.name.includes(message.author.username.toLowerCase()))
                );
            } catch (err) {
                console.error('[Legit] Không thể fetch danh sách kênh:', err.message);
            }
        }

        if (!ticketChannel) return;

        try {
            await ticketChannel.send({
                content: `✅ **Hệ thống đã ghi nhận Legit/Vouch của bạn!**\n> Cảm ơn bạn đã mua hàng tại Thập Cẩm Store. Kênh giao dịch này sẽ tự động đóng sau **15 giây**.`
            });

            setTimeout(async () => {
                try {
                    await ticketChannel.delete();
                } catch (err) {
                    console.error('[Legit] Lỗi xóa kênh ticket:', err.message);
                }
            }, 15000);
        } catch (e) {
            console.error('[Legit] Lỗi gửi thông báo vào ticket:', e.message);
        }
    }
};
