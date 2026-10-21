const config = require('../config/config');

class ContainerBuilder {
    constructor() { this.data = { type: 17, components: [] }; }
    addComponents(...components) { this.data.components.push(...components.map(c => c.toJSON ? c.toJSON() : c)); return this; }
    toJSON() { return this.data; }
}
class SectionBuilder {
    constructor() { this.data = { type: 9, components: [] }; }
    addComponents(...components) { this.data.components.push(...components.map(c => c.toJSON ? c.toJSON() : c)); return this; }
    setAccessory(accessory) { this.data.accessory = accessory.toJSON ? accessory.toJSON() : accessory; return this; }
    toJSON() { return this.data; }
}
class TextDisplayBuilder {
    constructor() { this.data = { type: 10 }; }
    setContent(content) { this.data.content = content; return this; }
    toJSON() { return this.data; }
}
class SeparatorBuilder {
    constructor() { this.data = { type: 14 }; }
    toJSON() { return this.data; }
}
class ThumbnailBuilder {
    constructor(isGallery = false) { this.data = { type: isGallery ? 12 : 11 }; }
    setURL(url) {
        if (this.data.type === 12) {
            this.data.media = { url };
            this.data.items = [{ media: { url } }];
        } else {
            this.data.url = url;
            this.data.media = { url };
        }
        return this;
    }
    toJSON() { return this.data; }
}

const LEADERBOARD_BANNER_URL = 'https://images.squarespace-cdn.com/content/v1/5bdae2425ffd20ce19a4c5c1/a0effae1-e3ae-4e30-9cc4-0f406d002dc5/Lyric_01.gif?format=1000w';

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
            let rankIcon;
            let rankName;
            let prefix = '';
            let suffix = '';

            if (index === 0) {
                rankIcon = '👑';
                rankName = 'ĐỘC TÔN (TOP 1)';
                prefix = '> **';
                suffix = '**';
            } else if (index === 1) {
                rankIcon = '🥈';
                rankName = 'Á QUÂN (TOP 2)';
                prefix = '> **';
                suffix = '**';
            } else if (index === 2) {
                rankIcon = '🥉';
                rankName = 'QUÝ TỘC (TOP 3)';
                prefix = '> **';
                suffix = '**';
            } else {
                rankIcon = '💎';
                rankName = `TOP ${index + 1}`;
                prefix = '';
                suffix = '';
            }

            const formattedAmount = Number(user.totalSpent).toLocaleString('vi-VN');
            let userDisplay = user.userId.includes('<@') ? user.userId : `<@${user.userId}>`;

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
        .setAccessory(new ThumbnailBuilder(false).setURL(thumbnailUrl || 'https://cdn.discordapp.com/attachments/1494640480078794972/1525112628312277087/png.png?ex=6a523351&is=6a50e1d1&hm=4063ff7e3b35b22e944238bed050280ca33e84e32293f0451e99d55631d40784&'));

    const detailsText = new TextDisplayBuilder().setContent(description);

    const container = new ContainerBuilder();

    container.addComponents(
        new ThumbnailBuilder(true).setURL(process.env.LEADERBOARD_BANNER_URL || LEADERBOARD_BANNER_URL),
        new SeparatorBuilder()
    );

    container.addComponents(
        section1,
        new SeparatorBuilder(),
        detailsText
    );

    return container.toJSON();
};
