const {
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ThumbnailBuilder
} = require('./components');

const DEFAULT_THUMBNAIL = 'https://cdn.discordapp.com/attachments/1494640480078794972/1525112628312277087/png.png?ex=6a523351&is=6a50e1d1&hm=4063ff7e3b35b22e944238bed050280ca33e84e32293f0451e99d55631d40784&';
const DEFAULT_BANNER = 'https://images.squarespace-cdn.com/content/v1/5bdae2425ffd20ce19a4c5c1/a0effae1-e3ae-4e30-9cc4-0f406d002dc5/Lyric_01.gif?format=1000w';

module.exports = function buildLeaderboardEmbed(topUsers, thumbnailUrl) {
    let description = '';

    if (!topUsers || topUsers.length === 0) {
        description = '> **Dưới đây là danh sách những đại gia đã chi tiêu nhiều nhất tại cửa hàng!**\n\n' +
            '> 🌟 *Hiện tại chưa có dữ liệu giao dịch nào.*\n' +
            '> 🛒 *Hãy là người đầu tiên mua tài khoản để ghi danh lên Bảng Vàng!*\n\n' +
            '*Bảng xếp hạng được hệ thống cập nhật tự động!*';
    } else {
        description = '> **Dưới đây là danh sách những đại gia đã chi tiêu nhiều nhất tại cửa hàng chúng tôi!**\n> Xin gửi lời cảm ơn chân thành nhất đến quý khách hàng.\n\n';

        topUsers.slice(0, 10).forEach((user, index) => {
            let rankName = `TOP ${index + 1}`;
            let prefix = '';
            let suffix = '';

            if (index === 0) {
                rankName = 'ĐỘC TÔN (TOP 1)';
                prefix = '> **';
                suffix = '**';
            } else if (index === 1) {
                rankName = 'Á QUÂN (TOP 2)';
                prefix = '> **';
                suffix = '**';
            } else if (index === 2) {
                rankName = 'QUÝ TỘC (TOP 3)';
                prefix = '> **';
                suffix = '**';
            }

            const formattedAmount = Number(user.totalSpent).toLocaleString('vi-VN');
            const userDisplay = user.userId.includes('<@') ? user.userId : `<@${user.userId}>`;

            if (index < 3) {
                description += `${prefix}${rankName}:${suffix} ${userDisplay}\n> ↳ Tổng chi: \`${formattedAmount} VNĐ\`\n\n`;
            } else {
                description += `**${rankName}:** ${userDisplay} - \`${formattedAmount} VNĐ\`\n`;
            }
        });

        description += '\n*Bảng xếp hạng được hệ thống cập nhật tự động!*';
    }

    const headerText = new TextDisplayBuilder().setContent(`**BẢNG VÀNG THÀNH TÍCH CHI TIÊU KHÁCH HÀNG**`);
    const section1 = new SectionBuilder()
        .addComponents(headerText)
        .setAccessory(new ThumbnailBuilder(false).setURL(thumbnailUrl || DEFAULT_THUMBNAIL));

    const detailsText = new TextDisplayBuilder().setContent(description);

    const container = new ContainerBuilder()
        .addComponents(
            new ThumbnailBuilder(true).setURL(process.env.LEADERBOARD_BANNER_URL || DEFAULT_BANNER),
            new SeparatorBuilder(),
            section1,
            new SeparatorBuilder(),
            detailsText
        );

    return container.toJSON();
};
