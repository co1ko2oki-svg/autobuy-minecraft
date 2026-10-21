const { readDB } = require('../database/db');
const buildLeaderboardEmbed = require('../embeds/leaderboardEmbed');

async function updateLeaderboard(client) {
    try {
        const leaderboardChannelId = process.env.LEADERBOARD_CHANNEL_ID;
        if (!leaderboardChannelId) return;

        let channel = client.channels.cache.get(leaderboardChannelId);
        if (!channel) {
            try {
                channel = await client.channels.fetch(leaderboardChannelId);
            } catch (e) {
                if (!client.leaderboardErrorLogged) {
                    console.error(`[Leaderboard - ${client.user?.tag || 'Bot'}] Không tìm thấy kênh Bảng Xếp Hạng. Vui lòng kiểm tra ID trong cấu hình.`);
                    client.leaderboardErrorLogged = true;
                }
                return;
            }
        }

        const db = readDB();
        const paidInvoices = Array.from(db.invoices.values()).filter(inv => inv.status === 'paid');
        const buyerMap = new Map();
        for (const inv of paidInvoices) {
            const b = buyerMap.get(inv.userId) || { userId: inv.userId, totalSpent: 0 };
            b.totalSpent += Number(inv.amount) || 0;
            buyerMap.set(inv.userId, b);
        }
        const topUsers = Array.from(buyerMap.values())
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10);

        const guildIcon = channel.guild ? channel.guild.iconURL({ dynamic: true, size: 256 }) : null;
        const embed = buildLeaderboardEmbed(topUsers, guildIcon);

        const messages = await channel.messages.fetch({ limit: 20 });
        const botMessages = messages.filter(m => m.author.id === client.user.id);

        if (botMessages.size > 0) {
            const targetMessage = botMessages.first();
            try {
                await targetMessage.edit({ flags: 32768, components: [embed], embeds: [], content: '' });
            } catch (err) {
                console.warn('[Leaderboard] Không thể sửa tin nhắn cũ, sẽ gửi tin nhắn mới:', err.message);
                await targetMessage.delete().catch(delErr => {
                    if (delErr.code !== 10008) console.warn('[Leaderboard] Lỗi xóa targetMessage cũ:', delErr.message);
                });
                await channel.send({ flags: 32768, components: [embed] });
            }

            if (botMessages.size > 1) {
                const extras = botMessages.clone();
                extras.delete(targetMessage.id);
                for (const [, msg] of extras) {
                    await msg.delete().catch(extraErr => {
                        if (extraErr.code !== 10008) console.warn('[Leaderboard] Lỗi xóa extra message:', extraErr.message);
                    });
                }
            }
        } else {
            await channel.send({ flags: 32768, components: [embed] });
        }
    } catch (error) {
        console.error('Lỗi khi cập nhật Bảng Xếp Hạng:', error);
    }
}

function startLeaderboardLoop(client) {
    updateLeaderboard(client);

    setInterval(() => updateLeaderboard(client), 5 * 60 * 1000);
}

module.exports = { startLeaderboardLoop, updateLeaderboard };
