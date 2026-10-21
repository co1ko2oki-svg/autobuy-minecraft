const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const { readDB, insertAccount, generateId } = require('../database/db');
const config = require('../config/config');
const { parseAccountsFromFile } = require('../utils/helpers');
const { buildStockEmbed } = require('../embeds/embedBuilder');
const { generatePlayerCard } = require('../../card/engine/pool');
const { sendStockLog } = require('../../card/webhookLog');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addstock')
        .setDescription('Thêm stock từ file txt (Chỉ Admin)')
        .addAttachmentOption(option =>
            option.setName('file')
                .setDescription('File txt chứa thông tin account')
                .setRequired(true)
        ),

    async execute(interaction) {
        const hasManageGuild = interaction.member && interaction.member.permissions.has('ManageGuild');
        const isAdminId = config.adminIds && config.adminIds.includes(interaction.user.id);
        const isBotOwner = process.env.BOT_ID === interaction.user.id;
        
        if (!hasManageGuild && !isAdminId && !isBotOwner) {
            return interaction.reply({ content: '❌ Bạn không có quyền sử dụng lệnh này (Yêu cầu quyền Quản Lý Server hoặc là Admin Bot).', flags: MessageFlags.Ephemeral });
        }

        const attachment = interaction.options.getAttachment('file');

        if (!attachment.name.endsWith('.txt')) {
            return interaction.reply({ content: 'Vui lòng upload file .txt', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const response = await axios.get(attachment.url);
            const fileContent = response.data;
            const accounts = parseAccountsFromFile(fileContent);

            if (accounts.length === 0) {
                const formatExample = `Định dạng sai. Vui lòng sử dụng định dạng sau:\n\nUsername : \nOwns MC : True\nCapes : \nRank: vip\nRecovery Code: \nPrimary Email : \nSecurity Email: \nSecret Key: \nPassword: \nGiá: 100k\n\n(Cách 1 dòng trống giữa các account)`;
                return interaction.editReply({ content: formatExample });
            }

            const { processStockAccounts } = require('../utils/stockManager');
            const result = await processStockAccounts(accounts, interaction.guild, interaction.user);
            await interaction.editReply({ content: result.message });
        } catch (error) {
            console.error('[AddStock] Error:', error);
            await interaction.editReply({ content: 'Có lỗi xảy ra khi xử lý file.' });
        }
    },
};
