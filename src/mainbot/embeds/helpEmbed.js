const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, ThumbnailBuilder } = require('./components');
const config = require('../config/config');

function getHelpMenuAndButtons() {
    const selectMenuRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('help_menu')
            .setPlaceholder('<a:Party_Cat:1503443335858360520> Chọn danh mục bạn cần hỗ trợ / xem lệnh...')
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions([
                {
                    label: 'Hướng Dẫn Mua Hàng & Thanh Toán',
                    description: 'Quy trình mua tài khoản tự động bằng mã QR',
                    value: 'help_buy',
                    emoji: '<:purplecart:1534933365453623407> '
                },
                {
                    label: 'Danh Sách Lệnh Khách Hàng',
                    description: 'Các lệnh /profile, /accounts, kiểm tra lịch sử',
                    value: 'help_user',
                    emoji: '<:MEMBER:1495802635989680148> '
                },
                {
                    label: 'Danh Sách Lệnh Quản Trị (Admin Only)',
                    description: 'Các lệnh đăng stock, xóa kho hàng',
                    value: 'help_admin',
                    emoji: '<a:setting:1507369942758985848> '
                }
            ])
    );

    const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('help_home')
            .setLabel('Trang Chủ')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('<a:as_minecraft:1498013150715445258> '),
        new ButtonBuilder()
            .setLabel('Vào Server Hỗ Trợ')
            .setStyle(ButtonStyle.Link)
            .setURL(config.mainServerInvite || 'https://discord.com')
            .setEmoji('<a:MoneySoaring:1511635740172353688> ')
    );

    return { selectMenuRow, buttonRow };
}

function buildHelpPanel(type, interaction) {
    let headerContent = '';
    let bodyContent = '';
    const avatarUrl = interaction.client.user.displayAvatarURL();
    const footerText = process.env.EMBED_FOOTER_TEXT || '*THẬP CẨM STORE • Secure Marketplace*';

    if (type === 'home') {
        headerContent = `**<a:box_open:1496132507417182259> TỔNG HỢP HƯỚNG DẪN SỬ DỤNG THẬP CẨM STORE <a:box_open:1496132507417182259>**\n\n` +
            `> <:purplecart:1534933365453623407>  **CHÀO MỪNG ĐẾN VỚI TRUNG TÂM HỖ TRỢ THẬP CẨM STORE**\n` +
            `> <a:pydis_pridespin:1499027468290621554>  *Hệ thống bán tự động tài khoản Minecraft chính hãng 24/7 uy tín hàng đầu.*`;

        bodyContent = `**<a:1_cardspin:1498681432728404008> LỰA CHỌN CHỦ ĐỀ HỖ TRỢ BÊN DƯỚI:**\n` +
            `> <:purplecart:1534933365453623407>  **Hướng Dẫn Mua Hàng:** Quy trình tạo ticket và thanh toán QR tự động.\n` +
            `> <:MEMBER:1495802635989680148>  **Lệnh Khách Hàng:** Quản lý lịch sử mua và tải về info acc.\n` +
            `> <a:setting:1507369942758985848>  **Lệnh Quản Trị:** Quản lý kho hàng cho Admin.\n\n` +
            `> <a:Blink:1523329369504874638>  *Vui lòng chọn một mục từ menu thả xuống bên dưới để xem hướng dẫn chi tiết!*\n\n` +
            `${footerText}`;
    }
    else if (type === 'help_buy') {
        headerContent = `**<a:pydis_pridespin:1499027468290621554>  QUY TRÌNH MUA HÀNG SIÊU TỐC <a:pydis_pridespin:1499027468290621554> **`;
        bodyContent = `> <a:box_open:1496132507417182259> **HƯỚNG DẪN GIAO DỊCH VÀ THANH TOÁN TỰ ĐỘNG**\n\n` +
            `> <a:c2muiten:1534931832015949945> **Bước 1:** Chọn tài khoản ưng ý tại các kênh Stock và bấm nút "**🛒 Mua Ngay**".\n` +
            `> <a:c2muiten:1534931832015949945> **Bước 2:** Hệ thống sẽ tự động mở 1 kênh thanh toán riêng (Ticket) dành riêng cho bạn.\n` +
            `> <a:c2muiten:1534931832015949945> **Bước 3:** Mở ứng dụng Ngân Hàng hoặc MoMo, quét mã QR trên hình để tự động điền số tiền và nội dung chuyển khoản (Đúng 100% không sai ký tự nào).\n` +
            `> <a:c2muiten:1534931832015949945> **Bước 4:** Chỉ sau 3-5 giây, Bot sẽ tự động duyệt đơn và gửi toàn bộ thông tin tài khoản qua tin nhắn riêng (DM).\n\n` +
            `> <a:1_cardspin:1498681432728404008> **Mẹo:** Kiểm tra tin nhắn DM của Bot đã được mở (Cho phép nhận tin nhắn từ thành viên server) trước khi mua!\n\n` +
            `${footerText}`;
    }
    else if (type === 'help_user') {
        headerContent = `**<a:pydis_pridespin:1499027468290621554>  TRUNG TÂM QUẢN LÝ TÀI KHOẢN CÁ NHÂN <a:pydis_pridespin:1499027468290621554> **`;
        bodyContent = `> <a:box_open:1496132507417182259> **DANH SÁCH LỆNH DÀNH CHO KHÁCH HÀNG**\n\n` +
            `> <a:c2muiten:1534931832015949945> \`/help\`: Mở trung tâm hỗ trợ tương tác này.\n` +
            `> <a:c2muiten:1534931832015949945> \`/profile\`: Xem thông tin hồ sơ khách hàng, tổng chi tiêu, cấp bậc VIP và 5 đơn hàng gần nhất.\n\n` +
            `> <a:1_cardspin:1498681432728404008> **Cấp Bậc VIP:** Chi tiêu trên 100k (Bạc), 500k (Vàng), 1,000k (VIP Customer) sẽ nhận được roll và đặc quyền riêng tại server!\n\n` +
            `${footerText}`;
    }
    else if (type === 'help_admin') {
        headerContent = `**<a:pydis_pridespin:1499027468290621554> HƯỚNG DẪN VẬN HÀNH DÀNH CHO ADMIN<a:pydis_pridespin:1499027468290621554>**`;
        bodyContent = `> <a:box_open:1496132507417182259> **DANH SÁCH LỆNH DÀNH CHO QUẢN TRỊ VIÊN (ADMIN)**\n\n` +
            `<a:box_open:1496132507417182259> **Quản lý kho hàng (Stock):**\n` +
            `> <a:c2muiten:1534931832015949945> \`/addstock file:<.txt>\`: Thêm hàng loạt tài khoản mới vào kho từ file txt và tự động đăng lên các kênh.\n` +
            `> <a:c2muiten:1534931832015949945> \`/delstock id:<ID>\`: Xóa tài khoản khỏi kho bằng ID và tự động xóa kênh bán.\n` +
            `> <a:c2muiten:1534931832015949945> \`/viewstock\`: Thống kê toàn bộ kho hàng đang phân loại theo Rank.\n\n` +
            `> <a:1_cardspin:1498681432728404008>
             **Khác:** \`/testcard\`: Test form tạo ảnh thẻ thông số Minecraft.\n\n` +
            `${footerText}`;
    }

    const headerText = new TextDisplayBuilder().setContent(headerContent);
    const section1 = new SectionBuilder()
        .addComponents(headerText)
        .setAccessory(new ThumbnailBuilder(false).setURL(avatarUrl));

    const bodyText = new TextDisplayBuilder().setContent(bodyContent);

    const { selectMenuRow, buttonRow } = getHelpMenuAndButtons();

    const container = new ContainerBuilder()
        .addComponents(
            section1,
            new SeparatorBuilder(),
            bodyText,
            selectMenuRow,
            buttonRow
        );

    return container.toJSON();
}

module.exports = {
    buildHelpPanel
};
