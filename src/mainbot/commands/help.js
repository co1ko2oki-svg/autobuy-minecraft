const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { buildHelpPanel } = require('../embeds/helpEmbed');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Gửi panel hướng dẫn tổng hợp vào kênh (Dành cho Admin)'),
    async execute(interaction) {
        if (!config.adminIds.includes(interaction.user.id)) {
            return interaction.reply({ content: '❌ Lỗi: Bạn không có quyền sử dụng lệnh này!', flags: MessageFlags.Ephemeral });
        }

        const component = buildHelpPanel('home', interaction);
        await interaction.channel.send({ flags: 32768, components: [component] });
        await interaction.reply({ content: '✅ Đã gửi panel help vào kênh này!', flags: MessageFlags.Ephemeral });
    },
};
