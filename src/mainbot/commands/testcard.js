const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder, MessageFlags } = require('discord.js');
const { generatePlayerCard } = require('../../card/engine/pool');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('testcard')
        .setDescription('Test thử form ảnh card (Chỉ Admin)')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Tên người chơi Minecraft')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('price')
                .setDescription('Giá tiền (VD: 140K)')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('rank')
                .setDescription('Rank (VD: MVP+)')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('capes')
                .setDescription('Tên capes, cách nhau dấu phẩy (VD: Cherry Blossom, Pan)')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('style')
                .setDescription('Mẫu thẻ')
                .setRequired(false)
                .addChoices(
                    { name: 'Thẻ 3D Xoay (GIF)', value: 'MinecraftProfile3D' },
                    { name: 'Thẻ Phẳng Minimal (PNG)', value: 'MinimalProfile' }
                )
        ),

    async execute(interaction) {
        const hasManageGuild = interaction.member && interaction.member.permissions.has('ManageGuild');
        const isAdminId = config.adminIds && config.adminIds.includes(interaction.user.id);
        const isBotOwner = process.env.BOT_ID === interaction.user.id;
        
        if (!hasManageGuild && !isAdminId && !isBotOwner) {
            return interaction.reply({ content: '❌ Bạn không có quyền sử dụng lệnh này.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();

        const username = interaction.options.getString('username');
        const price = interaction.options.getString('price') || '140K';
        const rank = interaction.options.getString('rank') || 'MVP+';
        const capes = interaction.options.getString('capes') || 'Cherry Blossom, Pan';
        const style = interaction.options.getString('style') || 'MinecraftProfile3D';

        const mockAccount = {
            username: username,
            price: price,
            rank: rank,
            capes: capes
        };

        try {
            const cardBuffer = await generatePlayerCard(mockAccount, config.hypixelApiKey || '', config.donutApiKey || '', style);
            const ext = style === 'MinimalProfile' ? 'png' : 'gif';
            const attachment = new AttachmentBuilder(cardBuffer, { name: `test-card.${ext}` });

            await interaction.editReply({ content: `✅ Ảnh test card cho **${username}**:`, files: [attachment] });
        } catch (error) {
            console.error('[TestCard] Lỗi khi tạo card:', error);
            await interaction.editReply({ content: '❌ Có lỗi xảy ra khi tạo ảnh card. Hãy xem console log để biết chi tiết.' });
        }
    },
};
