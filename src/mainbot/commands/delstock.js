const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { readDB, deleteAccount } = require('../database/db');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delstock')
        .setDescription('Xóa một account khỏi kho bằng ID (Chỉ Admin)')
        .addStringOption(option => 
            option.setName('id')
                .setDescription('ID của tài khoản cần xóa')
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const hasManageGuild = interaction.member && interaction.member.permissions.has('ManageGuild');
        const isAdminId = config.adminIds && config.adminIds.includes(interaction.user.id);
        const isBotOwner = process.env.BOT_ID === interaction.user.id;
        if (!hasManageGuild && !isAdminId && !isBotOwner) return;

        const focusedValue = interaction.options.getFocused().toLowerCase();
        const db = readDB();

        const availableAccounts = Array.from(db.accounts.values()).filter(a => !a.isSold);

        const filtered = availableAccounts.filter(acc => 
            acc._id.toLowerCase().includes(focusedValue) || 
            acc.username.toLowerCase().includes(focusedValue)
        ).slice(0, 25);

        await interaction.respond(
            filtered.map(acc => ({ name: `${acc.username} (${acc._id})`, value: acc._id }))
        );
    },

    async execute(interaction) {
        const hasManageGuild = interaction.member && interaction.member.permissions.has('ManageGuild');
        const isAdminId = config.adminIds && config.adminIds.includes(interaction.user.id);
        const isBotOwner = process.env.BOT_ID === interaction.user.id;
        
        if (!hasManageGuild && !isAdminId && !isBotOwner) {
            return interaction.reply({ content: '❌ Bạn không có quyền sử dụng lệnh này.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const accountId = interaction.options.getString('id');

        try {
            const db = readDB();
            const account = db.accounts.get(accountId);

            if (!account) {
                return interaction.followUp({ content: `Không tìm thấy tài khoản với ID: \`${accountId}\` trong kho.` });
            }

            deleteAccount(accountId);

            try {
                await interaction.editReply({ content: `✅ Đã xóa thành công tài khoản \`${accountId}\` khỏi kho hàng và kênh tương ứng đang được xóa!` });
            } catch (e) {
                console.error('Lỗi editReply trong delstock:', e);
            }

            const postsToDelete = (account.posts && account.posts.length > 0)
                ? account.posts
                : (account.stockChannelId ? [{ channelId: account.stockChannelId, guildId: interaction.guild?.id }] : []);

            for (const post of postsToDelete) {
                if (!post.channelId) continue;
                try {
                    const guildObj = (post.guildId && interaction.client.guilds.cache.get(post.guildId)) || interaction.guild;
                    if (guildObj) {
                        const channel = guildObj.channels.cache.get(post.channelId)
                            || await guildObj.channels.fetch(post.channelId).catch(() => null);
                        if (channel) {
                            await channel.delete().catch(() => null);
                        }
                    }
                } catch (e) {
                    console.log(`Không thể xóa kênh stock ${post.channelId}:`, e.message);
                }
            }
        } catch (error) {
            console.error('[DelStock] Error:', error);
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'Có lỗi xảy ra khi xóa tài khoản.', flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: 'Có lỗi xảy ra khi xóa tài khoản.', flags: MessageFlags.Ephemeral });
                }
            } catch (e) {}
        }
    },
};
