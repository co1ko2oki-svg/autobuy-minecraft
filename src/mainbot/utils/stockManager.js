const { ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { insertAccount, generateId } = require('../database/db');
const config = require('../config/config');
const buildStockEmbed = require('../embeds/stockEmbed');
const { generatePlayerCard } = require('../../card/engine/pool');
const { sendStockLog } = require('../../card/webhookLog');

async function processStockAccounts(accounts, guild, authorUser) {
    if (!accounts || accounts.length === 0) {
        return { success: false, message: 'Không có account nào hợp lệ để đăng.' };
    }

    const categories = [];
    for (const catId of config.stockCategoryIds) {
        let category = guild.channels.cache.get(catId) || guild.client.channels.cache.get(catId);
        if (!category) {
            category = await guild.channels.fetch(catId).catch(() => null)
                || await guild.client.channels.fetch(catId).catch(() => null);
        }
        if (category && category.type === ChannelType.GuildCategory) {
            categories.push(category);
        }
    }

    if (categories.length === 0) {
        return { success: false, message: 'Không tìm thấy bất kỳ danh mục Stock nào hợp lệ trên các server.' };
    }

    let addedCount = 0;
    const newlyCreatedAccounts = [];

    for (const acc of accounts) {
        const newAccount = {
            _id: generateId(),
            username: acc['Username'],
            ownsMC: acc['Owns MC'] || 'True',
            capes: acc['Capes'] || '',
            rank: acc['Rank'] || 'non',
            recoveryCode: acc['Recovery Code'] || '',
            primaryEmail: acc['Primary Email'] || '',
            securityEmail: acc['Security Email'] || '',
            secretKey: acc['Secret Key'] || '',
            password: acc['Password'],
            price: acc['Giá'],
            isSold: false,
            soldTo: null,
            soldAt: null,
            createdAt: new Date().toISOString()
        };
        newAccount.posts = [];

        const rankName = newAccount.rank;
        const capesCount = newAccount.capes ? newAccount.capes.split(',').length : 0;
        const channelName = `✅┆${rankName}┆${capesCount}cape`;

        let cardStyle = parseInt(acc['Mẫu Card'], 10);
        if (isNaN(cardStyle) || cardStyle < 1 || cardStyle > 3) {
            cardStyle = Math.floor(Math.random() * 3) + 1;
        }
        newAccount.cardStyle = cardStyle;

        let sharedCardBuffer = null;
        try {
            sharedCardBuffer = await generatePlayerCard(newAccount, config.hypixelApiKey || '', config.donutApiKey || '', cardStyle);
        } catch (err) {
            console.error(`[StockManager] Lỗi khi tạo ảnh Card cho ${newAccount.username}:`, err.message);
        }

        for (const category of categories) {
            const targetGuild = category.guild;
            let stockChannel;
            try {
                stockChannel = await targetGuild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: category.id,
                });
            } catch (createErr) {
                console.error(`[StockManager] Không thể tạo kênh ${channelName} tại ${targetGuild.name}:`, createErr.message);
                continue;
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`buy_${newAccount._id}`)
                    .setLabel('🛒 Mua Ngay')
                    .setStyle(ButtonStyle.Success)
            );

            const hasImage = sharedCardBuffer !== null && sharedCardBuffer !== undefined;
            const stockComponent = buildStockEmbed(newAccount, row, hasImage);

            const files = [];
            if (sharedCardBuffer) {
                files.push(new AttachmentBuilder(sharedCardBuffer, { name: 'stats-card.gif' }));
            }

            let sentMessage;
            try {
                sentMessage = await stockChannel.send({
                    flags: 32768,
                    components: [stockComponent],
                    files: files.length > 0 ? files : undefined
                });
            } catch (sendErr) {
                console.error('[StockManager] Lỗi khi tải ảnh hoặc bài đăng lên Discord:', sendErr.message);
            }

            if (!sentMessage) continue;

            newAccount.posts.push({
                guildId: targetGuild.id,
                channelId: stockChannel.id,
                messageId: sentMessage.id
            });
        }

        if (newAccount.posts.length > 0) {
            newAccount.stockChannelId = newAccount.posts[0].channelId;
            newAccount.stockMessageId = newAccount.posts[0].messageId;
        }

        newlyCreatedAccounts.push(newAccount);
        addedCount++;
    }

    for (const accData of newlyCreatedAccounts) {
        insertAccount(accData);
    }

    try {
        await sendStockLog(newlyCreatedAccounts, authorUser.username, authorUser.id);
    } catch (e) {
        console.error('[StockManager] Lỗi gửi webhook log:', e.message);
    }

    return { success: true, message: `✅ Đã thêm thành công **${addedCount}** accounts vào stock và tạo kênh!` };
}

module.exports = {
    processStockAccounts
};
