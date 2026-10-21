const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, MessageFlags, AttachmentBuilder } = require('discord.js');
const db = require('../database/db');
const config = require('../config/config');
const { generateQRUrl, checkSePayTransaction, getSePayTransactions } = require('./sepay');
const { sendCard, checkCardStatus } = require('./card9s');
const { isPayOSEnabled, generateOrderCode, createPayOSPayment, checkPayOSTransaction, cancelPayOSPayment } = require('./payos');
const buildSoldEmbed = require('../embeds/soldEmbed');
const buildStockEmbed = require('../embeds/stockEmbed');
const buildLogBillEmbed = require('../embeds/logBillEmbed');
const { generateInvoiceCard } = require('../../card/engine/pool');
const {
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ThumbnailBuilder
} = require('../embeds/components');

const DEFAULT_BANNER_ICON = 'https://cdn.discordapp.com/attachments/1494640480078794972/1525112628312277087/png.png?ex=6a523351&is=6a50e1d1&hm=4063ff7e3b35b22e944238bed050280ca33e84e32293f0451e99d55631d40784&';

function buildInvoiceComponent(interaction, invoiceId, discountMsg, actionRow, amount, content, payosLink = null) {
    const heroImage = new ThumbnailBuilder(true).setURL('attachment://invoice.png');
    const formattedPrice = amount ? amount.toLocaleString('vi-VN') + ' VNĐ' : '';

    let bankText = '';
    if (config.bankId && config.bankAccountNumber) {
        bankText = `\n\n**<a:note:1499026323123736808> HƯỚNG DẪN CHUYỂN KHOẢN (SePay & PayOS):**\n` +
            `> <:bankd:1535210078892851210> Ngân hàng: **${config.bankId}**\n` +
            `> <a:NTL_warn:1495443767388409988> STK: **${config.bankAccountNumber}**\n` +
            `> <:MEMBER:1495802635989680000> Chủ tài khoản: **${config.bankAccountName || 'Đang cập nhật'}**\n` +
            `> <a:MoneySoaring:1511635740172353688> Số tiền: **${formattedPrice}**\n` +
            `> <a:note:1499026323123736808> Nội dung CK: **${content}**\n` +
            (payosLink?.checkoutUrl ? `> 💳 Cổng PayOS: Nhấn nút **🔗 Thanh Toán PayOS** bên dưới\n\n` : `\n`) +
            `<a:warningfrst1:1496905696002703560> *(Hệ thống tự động duyệt qua SePay hoặc cổng PayOS)*`;
    }

    const sectionContent = `**<a:MoneySoaring:1511635740172353688> THÔNG TIN THANH TOÁN**\n<@${interaction.user.id}> Vui lòng quét mã QR trên ảnh hoặc chuyển khoản thủ công để nhận hàng.\n> ⏳ **Hóa đơn sẽ tự động hủy sau ${config.invoiceTimeoutMinutes} phút!**${discountMsg}${bankText}`;
    const sectionText = new TextDisplayBuilder().setContent(sectionContent);
    const sectionThumbnail = new ThumbnailBuilder(false).setURL(DEFAULT_BANNER_ICON);

    const section = new SectionBuilder()
        .addComponents(sectionText)
        .setAccessory(sectionThumbnail);

    const container = new ContainerBuilder()
        .addComponents(
            heroImage,
            new SeparatorBuilder(),
            section,
            new SeparatorBuilder(),
            actionRow
        );

    return container.toJSON();
}

function buildTicketCreatedComponent(ticketChannelId) {
    const sectionText = new TextDisplayBuilder().setContent(`**<a:catjump:1495799390085054464> ĐÃ TẠO TICKET**\nKênh thanh toán của bạn đã được tạo tại <#${ticketChannelId}>. Vui lòng vào kênh để tiếp tục giao dịch!`);
    const ticketThumbnail = new ThumbnailBuilder(false).setURL(DEFAULT_BANNER_ICON);

    const section = new SectionBuilder()
        .addComponents(sectionText)
        .setAccessory(ticketThumbnail);

    return new ContainerBuilder().addComponents(section).toJSON();
}

function buildDeliveryComponent(account, price, mainServerInvite) {
    const headerText = new TextDisplayBuilder().setContent(`🎉 **GIAO DỊCH THÀNH CÔNG!**\nCảm ơn bạn đã mua hàng. Dưới đây là thông tin tài khoản của bạn. Vui lòng **đổi mật khẩu** ngay sau khi đăng nhập!`);
    const capesText = account.capes ? account.capes : 'Không';
    const detailsContent = `**<:7577nametag:1511637363804082327> Username:** \`${account.username}\`\n` +
        `**<a:tcmccapesminecoin:1499262575525892208> Cape:** \`${capesText}\`\n` +
        `**THÔNG TIN BẢO MẬT:**\n` +
        `> **<:mail:1533039020584730685>  Email chính:** \`${account.primaryEmail || 'Không có'}\`\n` +
        `> **<:mail:1533039020584730685>  Email khôi phục:** \`${account.securityEmail || 'Không có'}\`\n` +
        `> **Mã khôi phục:** \`${account.recoveryCode || 'Không có'}\`\n` +
        `> **Secret Key:** \`${account.secretKey || 'Không có'}\`\n\n` +
        `**<a:tick2:1504811616636768288>  Mật khẩu:** \`${account.password}\`\n\n` +
        `*(File \`_info.txt\` đính kèm bên dưới lưu trữ đầy đủ thông tin để bạn sao lưu)*` +
        (mainServerInvite ? `\n\n<a:pydis_pridespin:1499027468290621554>  **Tham gia Server Chính:** ${mainServerInvite}` : '');

    const detailsText = new TextDisplayBuilder().setContent(detailsContent);
    const section = new SectionBuilder()
        .addComponents(headerText)
        .setAccessory(new ThumbnailBuilder(false).setURL(DEFAULT_BANNER_ICON));

    return new ContainerBuilder()
        .addComponents(section, new SeparatorBuilder(), detailsText)
        .toJSON();
}

function buildTosComponent() {
    const tosContent = `**ĐIỀU KHOẢN DỊCH VỤ (TOS) & CHÍNH SÁCH BẢO HÀNH**\n\n` +
        `**1. BẢO HÀNH:**\n` +
        `> Chỉ bảo hành lock trong vòng 1h.\n` +
        `> Mọi tài khoản mua tại hệ thống sẽ được bảo hành theo đúng thời gian quy định.\n` +
        `> Điều kiện bảo hành: Bạn **PHẢI vouch (+1 Legit)** vào kênh vouch của server trong vòng 3 giờ kể từ khi mua thành công.\n` +
        `> Nếu sau 3 giờ không vouch, chúng tôi có quyền **từ chối bảo hành**.\n\n` +
        `**2. QUY ĐỊNH SỬ DỤNG:**\n` +
        `> Bắt buộc phải thay **Mật khẩu, thêm Email khôi phục (Security Email)** và xóa các thông tin cũ ngay sau khi nhận được tài khoản (nếu là mail thapcamstoreg....@outlook.com).\n` +
        `> Tuyệt đối không sử dụng phần mềm thứ 3 (Hack/Cheat) dẫn đến việc tài khoản bị Ban.\n\n` +
        `**3. GIAO DỊCH & HOÀN TIỀN:**\n` +
        `> Nếu hệ thống hết hàng hoặc xảy ra lỗi kỹ thuật không giao được acc, bạn sẽ được Refund 100%.\n` +
        `> Trường hợp chuyển sai nội dung CK, chuyển sai số tiền, hệ thống sẽ không tự động duyệt. Bạn vui lòng tạo Ticket hoặc ping Admin để được hỗ trợ thủ công.\n\n` +
        `*Lưu ý: Bằng việc tiếp tục thanh toán, bạn xác nhận đã đọc và đồng ý với các Điều Khoản này.*`;

    const sectionText = new TextDisplayBuilder().setContent(tosContent);
    const thumbnail = new ThumbnailBuilder(false).setURL(DEFAULT_BANNER_ICON);

    const section = new SectionBuilder()
        .addComponents(sectionText)
        .setAccessory(thumbnail);

    return new ContainerBuilder().addComponents(section).toJSON();
}

async function getOrUpdateUser(userId) {
    const users = db.readDB().users;
    let user = users.get(userId);
    if (!user) {
        user = { id: userId, userId: userId, totalSpent: 0, totalBought: 0, purchaseHistory: [] };
        db.updateUser(user);
    }
    return user;
}

async function updateStockPostStatus(client, account, status = 'available') {
    if (!account) return;
    const posts = account.posts && account.posts.length > 0
        ? account.posts
        : (account.stockChannelId && account.stockMessageId ? [{ channelId: account.stockChannelId, messageId: account.stockMessageId }] : []);

    for (const post of posts) {
        try {
            const channel = client.channels.cache.get(post.channelId) || await client.channels.fetch(post.channelId).catch(() => null);
            if (!channel) continue;
            const message = await channel.messages.fetch(post.messageId).catch(() => null);
            if (!message) continue;

            const row = new ActionRowBuilder();
            if (status === 'pending') {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`buy_${account._id}`)
                        .setLabel('⏳ Đang Giao Dịch')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );
            } else if (status === 'available') {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`buy_${account._id}`)
                        .setLabel('🛒 Mua Ngay')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(false)
                );
            }

            const updatedComponent = buildStockEmbed(account, row, true, status);
            await message.edit({ components: [updatedComponent], flags: 32768 }).catch(() => null);
        } catch (e) {
            console.error(`[StockStatus] Lỗi cập nhật bài đăng cho account ${account.username}:`, e.message);
        }
    }
}

async function handleBuyButton(interaction, accountId) {
    const account = db.readDB().accounts.get(accountId);

    if (!account) {
        return interaction.reply({ content: '❌ Tài khoản không tồn tại hoặc đã bị xoá.', flags: MessageFlags.Ephemeral });
    }

    if (account.isSold) {
        return interaction.reply({ content: '❌ Tài khoản này đã được bán.', flags: MessageFlags.Ephemeral });
    }

    const activeInvoice = Array.from(db.readDB().invoices.values()).find(
        inv => inv.accountId === accountId && (inv.status === 'pending' || inv.status === 'card_pending') && new Date(inv.expiresAt) > new Date()
    );

    if (activeInvoice) {
        if (activeInvoice.userId === interaction.user.id) {
            return interaction.reply({ content: `❌ Bạn đang có một giao dịch chưa hoàn tất cho tài khoản này tại <#${activeInvoice.channelId}>.`, flags: MessageFlags.Ephemeral });
        }
        return interaction.reply({ content: '❌ Tài khoản này đang có người khác giao dịch, vui lòng thử lại sau ít phút hoặc chọn tài khoản khác.', flags: MessageFlags.Ephemeral });
    }

    if (!config.ticketCategoryIds || config.ticketCategoryIds.length === 0) {
        return interaction.reply({ content: '❌ Lỗi hệ thống: Chưa cấu hình danh mục Ticket.', flags: MessageFlags.Ephemeral });
    }

    const categoryId = config.ticketCategoryIds[0];
    const category = interaction.guild.channels.cache.get(categoryId) || await interaction.guild.channels.fetch(categoryId).catch(() => null);

    if (!category) {
        return interaction.reply({ content: '❌ Lỗi hệ thống: Không tìm thấy danh mục Ticket.', flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const lockResult = await db.tryLockAccount(accountId, interaction.user.id, 120000);
    if (!lockResult.acquired) {
        if (lockResult.lockUser === interaction.user.id) {
            return interaction.editReply({ content: '❌ Bạn đang tạo giao dịch cho tài khoản này, vui lòng đợi giây lát.' });
        }
        return interaction.editReply({ content: '❌ Tài khoản này đang có người khác giao dịch, vui lòng thử lại sau ít phút hoặc chọn tài khoản khác.' });
    }

    updateStockPostStatus(interaction.client, account, 'pending').catch(err => console.error('[StockStatus] Lỗi đặt pending:', err.message));

    const invoiceId = db.generateId();
    const priceStr = String(account.price || '0');
    const price = parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0;
    const content = `AC${invoiceId}`.toUpperCase();

    let payosOrderCode = null;
    let payosPaymentLink = null;
    if (isPayOSEnabled()) {
        payosOrderCode = generateOrderCode();
        payosPaymentLink = await createPayOSPayment({
            orderCode: payosOrderCode,
            amount: price,
            description: content
        }).catch(err => {
            console.error('[Ticket] Không thể tạo PayOS link:', err.message);
            return null;
        });
    }

    let ticketChannel;
    try {
        ticketChannel = await interaction.guild.channels.create({
            name: `buy-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                }
            ]
        });
    } catch (e) {
        console.error('[Ticket] Lỗi tạo kênh ticket:', e.message);
        await db.unlockAccount(accountId, interaction.user.id).catch(err => console.error('[Invoice] Lỗi unlockAccount:', err.message));
        updateStockPostStatus(interaction.client, account, 'available').catch(err => console.error('[StockStatus] Lỗi đặt available:', err.message));
        return interaction.editReply({ content: '❌ Không thể tạo kênh giao dịch.' });
    }

    const qrUrl = generateQRUrl(price, content);
    let invoiceBuffer = null;
    try {
        invoiceBuffer = await generateInvoiceCard({ invoiceId, amount: price, content }, qrUrl, account);
    } catch (e) {
        console.error('[Ticket] Lỗi tạo ảnh hóa đơn:', e.message);
    }

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`check_payment_${invoiceId}`)
            .setLabel('✅ Xác nhận')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`pay_card_${invoiceId}`)
            .setLabel('💳 Trả Thẻ')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(`cancel_invoice_${invoiceId}`)
            .setLabel('❌ Hủy bỏ')
            .setStyle(ButtonStyle.Danger)
    );

    if (payosPaymentLink && payosPaymentLink.checkoutUrl) {
        row.addComponents(
            new ButtonBuilder()
                .setLabel('🔗 Thanh Toán PayOS')
                .setStyle(ButtonStyle.Link)
                .setURL(payosPaymentLink.checkoutUrl)
        );
    }

    const invoiceMessageComponent = buildInvoiceComponent(interaction, invoiceId, '', row, price, content, payosPaymentLink);
    const files = [];
    if (invoiceBuffer) {
        files.push(new AttachmentBuilder(invoiceBuffer, { name: 'invoice.png' }));
    }

    await ticketChannel.send({ content: `<@${interaction.user.id}>` });
    await ticketChannel.send({
        components: [invoiceMessageComponent],
        flags: 32768,
        files: files
    });

    db.insertInvoice({
        invoiceId: invoiceId,
        userId: interaction.user.id,
        channelId: ticketChannel.id,
        amount: price,
        content: content,
        accountId: account._id,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + config.invoiceTimeoutMinutes * 60000).toISOString(),
        payos_order_code: payosOrderCode,
        payos_checkout_url: payosPaymentLink ? payosPaymentLink.checkoutUrl : null
    });

    updateStockPostStatus(interaction.client, account, 'pending');
    await interaction.editReply({ components: [buildTicketCreatedComponent(ticketChannel.id)], flags: 32768 });
}

async function handleAdminConfirm(interaction) {
    if (!config.adminIds.includes(interaction.user.id) && process.env.BOT_ID !== interaction.user.id) {
        return interaction.reply({ content: '❌ Bạn không có quyền duyệt giao dịch.', flags: MessageFlags.Ephemeral });
    }

    const ticketChannelId = interaction.channel.id;
    const invoices = Array.from(db.readDB().invoices.values()).filter(
        inv => inv.channelId === ticketChannelId && (inv.status === 'pending' || inv.status === 'card_pending')
    );

    if (invoices.length === 0) {
        return interaction.reply({ content: '❌ Không tìm thấy hoá đơn đang chờ xử lý trong kênh này.', flags: MessageFlags.Ephemeral });
    }

    const invoice = invoices[0];
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await processSuccessfulPayment(interaction, invoice, true);
}

async function checkPaymentStatus(interaction, invoiceId) {
    const invoice = db.readDB().invoices.get(invoiceId);
    if (!invoice) {
        return interaction.reply({ content: '❌ Hóa đơn không tồn tại hoặc đã hết hạn.', flags: MessageFlags.Ephemeral });
    }

    if (invoice.status === 'card_pending') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const cardRes = await checkCardStatus(invoice.card_request_id);
        if (cardRes.status === 'success') {
            await processSuccessfulPayment(interaction, invoice, false);
        } else {
            await interaction.editReply({ content: '⏳ Thẻ đang chờ hệ thống duyệt. Vui lòng thử lại sau ít phút!' });
        }
        return;
    }

    if (invoice.status !== 'pending') {
        return interaction.reply({ content: '❌ Hóa đơn này không ở trạng thái chờ thanh toán.', flags: MessageFlags.Ephemeral });
    }

    const isAdmin = (config.adminIds && config.adminIds.includes(interaction.user.id)) ||
        (interaction.member && interaction.member.permissions.has(PermissionFlagsBits.Administrator));

    if (isAdmin) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        await processSuccessfulPayment(interaction, invoice, true);
        return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    
    let isPaid = false;

    if (invoice.payos_order_code && isPayOSEnabled()) {
        try {
            isPaid = await checkPayOSTransaction(invoice.payos_order_code);
        } catch (e) {
            console.error('[CheckPayment] Lỗi check PayOS:', e.message);
        }
    }

    if (!isPaid) {
        isPaid = await checkSePayTransaction(invoice.amount, invoice.content);
    }

    if (isPaid) {
        await processSuccessfulPayment(interaction, invoice, false);
    } else {
        await interaction.editReply({ content: '⏳ Chưa tìm thấy giao dịch chuyển khoản (đã kiểm tra cả PayOS và SePay). Vui lòng thử lại sau ít phút!' });
    }
}

async function processSuccessfulPayment(interaction, invoice, isAdmin = false) {
    const client = interaction.client;
    const channel = interaction.channel;
    const responderId = interaction.user ? interaction.user.id : ((config.adminIds && config.adminIds[0]) || null);

    invoice.status = 'paid';
    db.updateInvoice(invoice);

    const account = db.readDB().accounts.get(invoice.accountId);
    if (!account) {
        const msg = '❌ Tài khoản không còn tồn tại trong hệ thống.';
        if (interaction.editReply) await interaction.editReply(msg).catch(err => console.warn('[Payment] Lỗi editReply missing account:', err.message));
        else if (interaction.reply) await interaction.reply(msg).catch(err => console.warn('[Payment] Lỗi reply missing account:', err.message));
        else if (channel) await channel.send(msg).catch(err => console.warn('[Payment] Lỗi send missing account:', err.message));
        return;
    }

    account.isSold = true;
    account.soldTo = invoice.userId;
    account.soldAt = new Date().toISOString();
    db.updateAccount(account);
    await db.unlockAccount(account._id, invoice.userId).catch(err => console.error('[Invoice] Lỗi unlockAccount:', err.message));

    const userStats = await getOrUpdateUser(invoice.userId);
    userStats.totalSpent += invoice.amount;
    userStats.totalBought += 1;
    userStats.purchaseHistory.push({
        invoiceId: invoice.invoiceId,
        accountId: account._id,
        amount: invoice.amount,
        username: account.username,
        price: invoice.amount,
        date: account.soldAt
    });
    db.updateUser(userStats);

    try {
        const postsToProcess = (account.posts && account.posts.length > 0)
            ? account.posts
            : (account.stockChannelId ? [{ channelId: account.stockChannelId, messageId: account.stockMessageId }] : []);

        for (const post of postsToProcess) {
            try {
                const stockChannel = client.channels.cache.get(post.channelId) || await client.channels.fetch(post.channelId).catch(() => null);
                if (!stockChannel) continue;

                if (post.messageId) {
                    const stockMsg = await stockChannel.messages.fetch(post.messageId).catch(() => null);
                    if (stockMsg) {
                        await stockMsg.delete().catch(err => {
                            if (err.code !== 10008) console.warn('[Payment] Lỗi xóa stock message:', err.message);
                        });
                    }
                }
                const soldComponent = buildSoldEmbed(account, `<@${invoice.userId}>`, (config.adminIds && config.adminIds[0]) || '');
                await stockChannel.send({
                    components: [soldComponent],
                    flags: 32768,
                    allowedMentions: { parse: [] }
                }).catch(err => console.error(`[Payment] Lỗi gửi thông báo bán vào ${post.channelId}:`, err.message));
            } catch (postErr) {
                console.error(`[Payment] Lỗi cập nhật bài đăng stock ${post.channelId}:`, postErr.message);
            }
        }
    } catch (e) {
        console.error('[Payment] Lỗi cập nhật kênh stock:', e.message);
    }

    try {
        const guild = channel?.guild || client.guilds.cache.get(config.mainGuildId) || client.guilds.cache.first();
        if (guild) {
            const member = await guild.members.fetch(invoice.userId).catch(() => null);
            if (member) {
                const rolesToAdd = [];
                if (config.buyerRoleIds && config.buyerRoleIds.length > 0) {
                    rolesToAdd.push(...config.buyerRoleIds);
                }
                if (userStats.totalSpent >= 1000000 && config.roleVipIds && config.roleVipIds.length > 0) {
                    rolesToAdd.push(...config.roleVipIds);
                } else if (userStats.totalSpent >= 500000 && config.role500kIds && config.role500kIds.length > 0) {
                    rolesToAdd.push(...config.role500kIds);
                } else if (userStats.totalSpent >= 100000 && config.role100kIds && config.role100kIds.length > 0) {
                    rolesToAdd.push(...config.role100kIds);
                }
                const validRoles = rolesToAdd.filter(r => r && !member.roles.cache.has(r));
                if (validRoles.length > 0) {
                    await member.roles.add(validRoles).catch(err => console.error('[Role] Lỗi add role:', err.message));
                }
            }
        }
    } catch (roleErr) {
        console.error('[Role] Lỗi xử lý role khách hàng:', roleErr.message);
    }

    try {
        if (config.logChannelIds && config.logChannelIds.length > 0) {
            const logChannel = client.channels.cache.get(config.logChannelIds[0])
                || await client.channels.fetch(config.logChannelIds[0]).catch(() => null);
            if (logChannel) {
                const buyerUser = await client.users.fetch(invoice.userId).catch(() => null);
                const billComponent = buildLogBillEmbed(invoice, account, buyerUser, client, isAdmin, responderId);
                await logChannel.send({ components: [billComponent], flags: 32768 }).catch(err => {
                    console.error('[Payment] Lỗi gửi log bill vào kênh:', err.message);
                });
            }
        }
    } catch (e) {
        console.error('[Payment] Lỗi gửi log bill:', e.message);
    }

    const fileContent = `Username: ${account.username}\nPassword: ${account.password}\nPrimary Email: ${account.primaryEmail || 'Không có'}\nSecurity Email: ${account.securityEmail || 'Không có'}\nRecovery Code: ${account.recoveryCode || 'Không có'}\nSecret Key: ${account.secretKey || 'Không có'}`;
    const txtAttachment = new AttachmentBuilder(Buffer.from(fileContent, 'utf-8'), { name: '_info.txt' });
    const deliveryComponent = buildDeliveryComponent(account, invoice.amount, config.mainServerInvite);

    let dmFailed = false;
    try {
        const user = await client.users.fetch(invoice.userId);
        await user.send({
            components: [deliveryComponent],
            flags: 32768,
            files: [txtAttachment]
        });
    } catch (e) {
        dmFailed = true;
    }

    const legitChannelId = config.legitChannelIds && config.legitChannelIds.length > 0 ? config.legitChannelIds[0] : '';
    const ownerId = (config.adminIds && config.adminIds[0]) || '';
    const ownerTag = ownerId ? `<@${ownerId}>` : '@seller';
    const legitHint = legitChannelId ? ` xin vui lòng legit tại kênh <#${legitChannelId}> với nội dung:` : '';
    const successMsg = `✅ Đã gửi thông tin về DMs cho <@${invoice.userId}>${legitHint}\nMobile:\n\`+1 Legit ${ownerTag} mfa\`\nPC:\n\`\`\`+1 Legit ${ownerTag} mfa\`\`\``;

    if (dmFailed) {
        if (channel) {
            await channel.send({ content: `<@${invoice.userId}> ❌ Bot không thể gửi DM cho bạn. Vui lòng lưu lại file đính kèm dưới đây trước khi kênh bị xoá!` }).catch(err => console.warn('[Payment] Lỗi gửi DM fallback thông báo:', err.message));
            await channel.send({
                components: [deliveryComponent],
                flags: 32768,
                files: [txtAttachment]
            }).catch(err => console.error('[Payment] Lỗi gửi file delivery vào channel:', err.message));
        }
    } else if (channel) {
        await channel.send({ content: successMsg }).catch(err => console.warn('[Payment] Lỗi gửi successMsg vào channel:', err.message));
    }

    if (interaction.editReply) {
        await interaction.editReply({ content: successMsg }).catch(err => console.warn('[Payment] Lỗi editReply successMsg:', err.message));
    } else if (interaction.reply) {
        await interaction.reply({ content: successMsg }).catch(err => console.warn('[Payment] Lỗi reply successMsg:', err.message));
    }

    if (channel) {
        if (dmFailed) {
            await channel.send({ content: `⚠️ **Lưu ý:** Bot không gửi được DM cho bạn nên kênh này sẽ được giữ lại trong **10 phút** để bạn sao lưu thông tin tài khoản bên trên. Vui lòng tải file \`_info.txt\` về máy ngay!` }).catch(err => console.warn('[Payment] Lỗi gửi lưu ý sao lưu:', err.message));
            setTimeout(async () => {
                try {
                    await channel.delete();
                } catch (e) {
                    if (e.code !== 10003) console.warn('[Ticket] Lỗi xóa ticket sau fallback DM:', e.message);
                }
            }, 10 * 60 * 1000);
        } else {
            setTimeout(async () => {
                try {
                    await channel.delete();
                } catch (e) {
                    if (e.code !== 10003) console.warn('[Ticket] Lỗi xóa ticket sau thanh toán:', e.message);
                }
            }, 5 * 60 * 1000);
        }
    }
}

async function cancelInvoice(interaction, invoiceId) {
    const invoice = db.readDB().invoices.get(invoiceId);
    if (!invoice) {
        return interaction.reply({ content: '❌ Hóa đơn không tồn tại.', flags: MessageFlags.Ephemeral });
    }

    if (invoice.userId !== interaction.user.id && !config.adminIds.includes(interaction.user.id)) {
        return interaction.reply({ content: '❌ Bạn không có quyền hủy hóa đơn này.', flags: MessageFlags.Ephemeral });
    }

    invoice.status = 'cancelled';
    if (invoice.payos_order_code && isPayOSEnabled()) {
        cancelPayOSPayment(invoice.payos_order_code).catch(err => console.warn('[PayOS] Lỗi cancelPayOSPayment:', err.message));
    }
    await db.unlockAccount(invoice.accountId, invoice.userId).catch(err => console.error('[Invoice] Lỗi unlockAccount:', err.message));
    db.updateInvoice(invoice);
    const account = db.readDB().accounts.get(invoice.accountId);
    if (account) updateStockPostStatus(interaction.client, account, 'available');

    await interaction.reply({ content: '✅ Đã hủy hóa đơn. Kênh sẽ bị xóa trong giây lát.', flags: MessageFlags.Ephemeral });

    setTimeout(async () => {
        try {
            await interaction.channel.delete();
        } catch (e) {
            if (e.code !== 10003) console.warn('[Ticket] Lỗi xóa ticket sau khi hủy:', e.message);
        }
    }, 3000);
}

async function handleCardSubmit(interaction, invoiceId) {
    const invoice = db.readDB().invoices.get(invoiceId);
    if (!invoice) {
        return interaction.reply({ content: '❌ Hóa đơn không tồn tại.', flags: MessageFlags.Ephemeral });
    }

    const telco = interaction.fields.getTextInputValue('card_telco');
    const amount = interaction.fields.getTextInputValue('card_amount');
    const serial = interaction.fields.getTextInputValue('card_serial');
    const pin = interaction.fields.getTextInputValue('card_pin');

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const result = await sendCard(telco, amount, serial, pin, invoiceId);
    if (result.success) {
        invoice.status = 'card_pending';
        invoice.card_request_id = invoiceId;
        invoice.card_amount = parseInt(amount, 10) || 0;
        db.updateInvoice(invoice);

        await interaction.editReply({ content: `✅ Đã gửi thẻ thành công. Trạng thái: Chờ duyệt.\nVui lòng đợi hoặc bấm nút Xác nhận để check thẻ!` });
    } else {
        await interaction.editReply({ content: `❌ Lỗi nạp thẻ: ${result.message}` });
    }
}

async function recoverOrphanedAccounts(client) {
    try {
        const invoices = Array.from(db.readDB().invoices.values()).filter(
            i => i.status === 'pending' || i.status === 'card_pending'
        );
        for (const inv of invoices) {
            if (new Date(inv.expiresAt) < new Date()) {
                inv.status = 'cancelled';
                await db.unlockAccount(inv.accountId, inv.userId).catch(err => console.error('[Invoice] Lỗi unlockAccount:', err.message));
                db.updateInvoice(inv);
                const acc = db.readDB().accounts.get(inv.accountId);
                if (acc) updateStockPostStatus(client, acc, 'available');
            }
        }
    } catch (e) {
        console.error('[Invoice] Lỗi recoverOrphanedAccounts:', e.message);
    }
}

async function startPaymentCheckLoop(client) {
    setInterval(async () => {
        try {
            const now = new Date();
            const allInvoices = Array.from(db.readDB().invoices.values());

            for (const inv of allInvoices) {
                if ((inv.status === 'pending' || inv.status === 'card_pending') && new Date(inv.expiresAt) < now) {
                    inv.status = 'cancelled';
                    if (inv.payos_order_code && isPayOSEnabled()) {
                        cancelPayOSPayment(inv.payos_order_code).catch(err => console.warn('[PayOS] Lỗi cancelPayOSPayment:', err.message));
                    }
                    await db.unlockAccount(inv.accountId, inv.userId).catch(err => console.error('[Invoice] Lỗi unlockAccount:', err.message));
                    db.updateInvoice(inv);
                    const acc = db.readDB().accounts.get(inv.accountId);
                    if (acc) updateStockPostStatus(client, acc, 'available');

                    const channel = client.channels.cache.get(inv.channelId)
                        || await client.channels.fetch(inv.channelId).catch(() => null);
                    if (channel) {
                        await channel.send('⏳ Hóa đơn đã hết thời hạn chờ thanh toán (10 phút). Kênh sẽ tự động đóng sau 10 giây.').catch(err => console.warn('[Invoice] Lỗi gửi thông báo hết hạn:', err.message));
                        setTimeout(async () => {
                            try {
                                await channel.delete();
                            } catch (e) {
                                if (e.code !== 10003) console.warn('[Invoice] Lỗi xóa ticket hết hạn:', e.message);
                            }
                        }, 10000);
                    }
                }
            }

            const pendingBankInvoices = allInvoices.filter(i => i.status === 'pending' && new Date(i.expiresAt) >= now);
            if (pendingBankInvoices.length > 0) {
                let sepayTransactions = null;
                try {
                    sepayTransactions = await getSePayTransactions();
                } catch (e) {
                    console.error('[PaymentLoop] Lỗi tải giao dịch SePay:', e.message);
                }

                for (const inv of pendingBankInvoices) {
                    let isPaid = false;

                    if (inv.payos_order_code && isPayOSEnabled()) {
                        try {
                            isPaid = await checkPayOSTransaction(inv.payos_order_code);
                        } catch (payosErr) {
                            console.error('[PaymentLoop] Lỗi check PayOS:', payosErr.message);
                        }
                    }

                    if (!isPaid && sepayTransactions && sepayTransactions.length > 0) {
                        isPaid = await checkSePayTransaction(inv.amount, inv.content, sepayTransactions);
                    }

                    if (isPaid) {
                        const channel = client.channels.cache.get(inv.channelId)
                            || await client.channels.fetch(inv.channelId).catch(() => null);
                        const context = { client, channel, user: { id: (config.adminIds && config.adminIds[0]) || null } };
                        await processSuccessfulPayment(context, inv, false);
                    }
                }
            }

            const pendingCardInvoices = allInvoices.filter(i => i.status === 'card_pending' && new Date(i.expiresAt) >= now);
            for (const inv of pendingCardInvoices) {
                const res = await checkCardStatus(inv.card_request_id);
                if (res.status === 'success') {
                    const channel = client.channels.cache.get(inv.channelId)
                        || await client.channels.fetch(inv.channelId).catch(() => null);
                    if (!channel) {
                        inv.status = 'paid';
                        db.updateInvoice(inv);
                        continue;
                    }
                    const context = { client, channel, user: { id: (config.adminIds && config.adminIds[0]) || null } };
                    await processSuccessfulPayment(context, inv, false);
                } else if (res.status === 'failed') {
                    inv.status = 'cancelled';
                    await db.unlockAccount(inv.accountId, inv.userId).catch(err => console.error('[Invoice] Lỗi unlockAccount:', err.message));
                    db.updateInvoice(inv);
                    const acc = db.readDB().accounts.get(inv.accountId);
                    if (acc) updateStockPostStatus(client, acc, 'available');

                    const channel = client.channels.cache.get(inv.channelId)
                        || await client.channels.fetch(inv.channelId).catch(() => null);
                    if (channel) {
                        await channel.send('❌ Thẻ nạp đã bị từ chối hoặc sai mệnh giá. Hóa đơn đã bị huỷ. Kênh sẽ tự động đóng sau 10 giây.').catch(err => console.warn('[Invoice] Lỗi gửi thông báo hủy thẻ:', err.message));
                        setTimeout(async () => {
                            try {
                                await channel.delete();
                            } catch (e) {
                                if (e.code !== 10003) console.warn('[Invoice] Lỗi xóa ticket thẻ hủy:', e.message);
                            }
                        }, 10000);
                    }
                }
            }
        } catch (e) {
            console.error('[PaymentLoop] Lỗi kiểm tra thanh toán tự động:', e.message);
        }
    }, 15000);
}

module.exports = {
    buildInvoiceComponent,
    buildTicketCreatedComponent,
    buildDeliveryComponent,
    buildTosComponent,
    handleBuyButton,
    handleAdminConfirm,
    checkPaymentStatus,
    cancelInvoice,
    handleCardSubmit,
    recoverOrphanedAccounts,
    startPaymentCheckLoop
};
