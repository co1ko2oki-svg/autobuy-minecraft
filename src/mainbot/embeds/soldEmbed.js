
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

module.exports = function buildSoldEmbed(account, buyer, botOwnerId) {
    let description = `<a:catjump:1495799390085054464> **Tài khoản đã được bán thành công!**\n\n`;
    description += `<a:MoneySoaring:1511635740172353688> **Mặt hàng:** \`${account.username}\`\n`;
    description += `<:MEMBER:1495802635989680148> **Khách hàng:** ${buyer}\n\n`;

    const sectionText = new TextDisplayBuilder().setContent(`**<a:MoneySoaring:1511635740172353688> ĐÃ BÁN: ${account.username}**\n\n${description}`);
    const sectionThumbnail = new ThumbnailBuilder(false).setURL('https://cdn.discordapp.com/emojis/1511635740172353688.webp');

    const section = new SectionBuilder()
        .addComponents(sectionText)
        .setAccessory(sectionThumbnail);

    const storeName = process.env.EMBED_FOOTER_TEXT ? process.env.EMBED_FOOTER_TEXT.split('•')[0].replace(/\*/g, '').trim() : 'Thập Cẩm Store';
    const tagString = botOwnerId ? `<@${botOwnerId}>` : (config.adminIds && config.adminIds[0] ? `<@${config.adminIds[0]}>` : '@seller');
    const warrantyText = new TextDisplayBuilder().setContent(`<a:note:1499026323123736808> **ĐIỀU KIỆN BẢO HÀNH**\n>>> **YÊU CẦU BẮT BUỘC:** Khách hàng vui lòng **+1 legit/vouch và nhớ tag ${tagString}** vào kênh Legit của server để được hệ thống và admin hỗ trợ bảo hành nhé!\n\n*Cảm ơn bạn đã tin tưởng và ủng hộ ${storeName}!* <a:hgtt_4_lovekiss2:1495803124911182024>`);

    const container = new ContainerBuilder()
        .addComponents(
            section,
            new SeparatorBuilder(),
            warrantyText
        );

    return container.toJSON();
};
