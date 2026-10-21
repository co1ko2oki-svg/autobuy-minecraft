const { SlashCommandBuilder } = require('discord.js');
const { readDB } = require('../database/db');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Xem thông tin hồ sơ khách hàng của bạn'),
    async execute(interaction) {
        const db = readDB();
        const userId = interaction.user.id;

        const userRecord = Array.from(db.users.values()).find(u => u.userId === userId) || { totalSpent: 0, purchaseHistory: [] };

        const totalSpent = userRecord.totalSpent;
        const purchaseHistory = userRecord.purchaseHistory || [];

        const guild = interaction.guild;
        const member = guild ? await guild.members.fetch(userId).catch(() => null) : null;

        let currentRank = 'Thành Viên Mới';
        if (member) {
            const hasVip = config.roleVipIds?.some(r => member.roles.cache.has(r));
            const has500k = config.role500kIds?.some(r => member.roles.cache.has(r));
            const has100k = config.role100kIds?.some(r => member.roles.cache.has(r));

            if (hasVip) currentRank = '💎 VIP Customer (> 1,000,000đ)';
            else if (has500k) currentRank = '🥇 Vàng (> 500,000đ)';
            else if (has100k) currentRank = '🥈 Bạc (> 100,000đ)';
        }

        let historyStr = 'Chưa có giao dịch nào.';
        if (purchaseHistory.length > 0) {
            const recent = purchaseHistory.slice(-5).reverse();
            historyStr = recent.map((item, index) => {
                const d = new Date(item.date);
                const dateStr = d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN');
                const displayName = item.username || item.accountId || 'N/A';
                const displayPrice = (item.price ?? item.amount ?? 0);
                return `**${index + 1}.** \`${displayName}\` - **${displayPrice.toLocaleString()}đ** *(Ngày: ${dateStr})*`;
            }).join('\n');
        }

        const { ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, ThumbnailBuilder } = require('../embeds/embedBuilder');

        const headerText = new TextDisplayBuilder().setContent(`**👤 Hồ Sơ Của ${interaction.user.username}**`);
        const avatar = new ThumbnailBuilder(false).setURL(interaction.user.displayAvatarURL());

        const section = new SectionBuilder()
            .addComponents(headerText)
            .setAccessory(avatar);

        let content = `**💰 Tổng Chi Tiêu:** \`${totalSpent.toLocaleString()} VNĐ\`\n` +
            `**🏷️ Cấp Bậc Hiện Tại:** \`${currentRank}\`\n\n` +
            `**🛒 Lịch Sử Mua Gần Đây (5 tài khoản):**\n` +
            historyStr;

        const bodyText = new TextDisplayBuilder().setContent(content);

        const container = new ContainerBuilder()
            .addComponents(section, new SeparatorBuilder(), bodyText);

        await interaction.reply({ flags: 32768, components: [container.toJSON()] });
    },
};
