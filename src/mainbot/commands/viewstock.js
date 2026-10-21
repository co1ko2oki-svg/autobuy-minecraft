const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { readDB } = require('../database/db');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('viewstock')
        .setDescription('Xem danh sách tài khoản hiện có trong kho (Chỉ Admin)'),

    async execute(interaction) {
        const hasManageGuild = interaction.member && interaction.member.permissions.has('ManageGuild');
        const isAdminId = config.adminIds && config.adminIds.includes(interaction.user.id);
        const isBotOwner = process.env.BOT_ID === interaction.user.id;
        
        if (!hasManageGuild && !isAdminId && !isBotOwner) {
            return interaction.reply({ content: '❌ Bạn không có quyền sử dụng lệnh này.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const db = readDB();
            const availableAccounts = Array.from(db.accounts.values()).filter(acc => !acc.isSold);

            if (availableAccounts.length === 0) {
                return interaction.editReply({ content: 'Kho hàng hiện tại đang trống.' });
            }

            const rankGroups = {};
            availableAccounts.forEach(acc => {
                const rank = acc.rank || 'non';
                if (!rankGroups[rank]) rankGroups[rank] = [];
                rankGroups[rank].push(acc);
            });

            let desc = '**Chi Tiết Các Tài Khoản Trong Kho:**\n\n';
            for (const [rank, accounts] of Object.entries(rankGroups)) {
                desc += `💎 **Rank ${rank}** (${accounts.length} accounts):\n`;

                const displayLimit = 15;
                accounts.slice(0, displayLimit).forEach(acc => {
                    desc += `> 👤 \`${acc.username}\`  |  🆔 \`${acc._id}\`\n`;
                });

                if (accounts.length > displayLimit) {
                    desc += `> *...và ${accounts.length - displayLimit} account khác*\n`;
                }
                desc += '\n';
            }

            if (desc.length > 4000) {
                desc = desc.substring(0, 4000) + '...\n\n(Danh sách quá dài nên bị cắt bớt)';
            }

            const { ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, ThumbnailBuilder } = require('../embeds/embedBuilder');

            const headerText = new TextDisplayBuilder().setContent(`**📦 Thống Kê Kho Hàng**\nTổng cộng: **${availableAccounts.length}** accounts có sẵn.`);
            const section = new SectionBuilder()
                .addComponents(headerText)
                .setAccessory(new ThumbnailBuilder(false).setURL(interaction.client.user.displayAvatarURL()));
            const bodyText = new TextDisplayBuilder().setContent(desc);

            const container = new ContainerBuilder()
                .addComponents(section, new SeparatorBuilder(), bodyText);

            await interaction.editReply({ flags: 32768, components: [container.toJSON()], embeds: [], content: '' });
        } catch (error) {
            console.error('[ViewStock] Error:', error);
            await interaction.followUp({ content: 'Có lỗi xảy ra khi lấy thống kê kho hàng.' });
        }
    },
};
