const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

const CONFIG_PATH = path.join(__dirname, '../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set')
        .setDescription('Cấu hình hệ thống (Dành cho Admin)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('channel')
                .setDescription('Thiết lập kênh/danh mục cho hệ thống')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Bạn muốn thiết lập kênh/danh mục nào?')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Danh mục Ticket', value: 'TICKET_CATEGORY_ID' },
                            { name: 'Danh mục Stock', value: 'STOCK_CATEGORY_ID' },
                            { name: 'Kênh Hoá Đơn (Bill Channel)', value: 'LOG_CHANNEL_ID' },
                            { name: 'Kênh Uy Tín (Top Buyer)', value: 'LEGIT_CHANNEL_ID' },
                            { name: 'Kênh Nhập Hàng (Input)', value: 'INPUT_CHANNEL_ID' },
                            { name: 'Kênh Bảng Xếp Hạng (Leaderboard)', value: 'LEADERBOARD_CHANNEL_ID' }
                        )
                )
                .addChannelOption(option =>
                    option.setName('target')
                        .setDescription('Chọn kênh hoặc danh mục đích')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        if (!config.adminIds.includes(interaction.user.id)) {
            return interaction.reply({ content: '❌ Lỗi: Bạn không có quyền sử dụng lệnh này!', flags: MessageFlags.Ephemeral });
        }

        const type = interaction.options.getString('type');
        const target = interaction.options.getChannel('target');

        let cfg = {};
        if (fs.existsSync(CONFIG_PATH)) {
            try {
                cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
            } catch (e) {
                return interaction.reply({ content: '❌ Lỗi: File `config.json` bị hỏng, không thể đọc!', flags: MessageFlags.Ephemeral });
            }
        } else {
            return interaction.reply({ content: '❌ Lỗi: Không tìm thấy file `config.json`!', flags: MessageFlags.Ephemeral });
        }

        cfg[type] = target.id;
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));

        process.env[type] = target.id;
        const KEY_MAP = {
            TICKET_CATEGORY_ID: 'ticketCategoryIds',
            STOCK_CATEGORY_ID: 'stockCategoryIds',
            LOG_CHANNEL_ID: 'logChannelIds',
            LEGIT_CHANNEL_ID: 'legitChannelIds',
            INPUT_CHANNEL_ID: 'inputChannelIds',
            LEADERBOARD_CHANNEL_ID: 'leaderboardChannelId'
        };
        if (KEY_MAP[type]) {
            if (type === 'LEADERBOARD_CHANNEL_ID') {
                config[KEY_MAP[type]] = target.id;
            } else {
                config[KEY_MAP[type]] = [target.id];
            }
        }

        await interaction.reply({ 
            content: `✅ Đã thiết lập \`${type}\` thành <#${target.id}>. Cấu hình đã được áp dụng ngay lập tức.`, 
            flags: MessageFlags.Ephemeral 
        });
    },
};
