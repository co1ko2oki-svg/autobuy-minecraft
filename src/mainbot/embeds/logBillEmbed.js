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

module.exports = function buildLogBillEmbed(invoice, account, buyer, client, confirmedByAdmin = false, adminId = null) {
    const createdAtDate = invoice?.createdAt ? new Date(invoice.createdAt) : new Date();
    const unixTimestamp = Math.floor(createdAtDate.getTime() / 1000);
    const dateStr = `<t:${unixTimestamp}:F> (<t:${unixTimestamp}:R>)`;

    const buyerUsername = (buyer && typeof buyer === 'object' && buyer.username) ? buyer.username : 'N/A';
    const buyerAvatar = (buyer && typeof buyer === 'object' && typeof buyer.displayAvatarURL === 'function')
        ? buyer.displayAvatarURL({ dynamic: true })
        : (client && client.user ? client.user.displayAvatarURL() : '');
    
    const amount = invoice?.amount || 0;
    const formattedPrice = String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + ' VNĐ';

    const headerText = new TextDisplayBuilder().setContent(`**🎉 GIAO DỊCH HOÀN TẤT**\n> 🔖 Mã Đơn: \`${invoice?.invoiceId || 'N/A'}\`\n> 💳 Code: \`${invoice?.content || 'N/A'}\``);
    const avatar = new ThumbnailBuilder(false).setURL(buyerAvatar);

    const section1 = new SectionBuilder()
        .addComponents(headerText)
        .setAccessory(avatar);

    const accountName = account?.username || 'Không xác định';
    const channelId = account?.stockChannelId || 'Không xác định';
    const userId = invoice?.userId || 'Unknown';

    const detailsContent = `**<:MEMBER:1495802635989680148> KHÁCH HÀNG:**\n` +
        `> **Người mua:** \`${buyerUsername}\` (<@${userId}>)\n` +
        `> **ID:** \`${userId}\`\n\n` +
        `**<a:box_open:1496132507417182259> SẢN PHẨM MUA:**\n` +
        `> **Account:** \`${accountName}\`\n` +
        `> **Từ kênh:** ${channelId !== 'Không xác định' ? `<#${channelId}>` : `\`${channelId}\``}\n` +
        `> **Giá tiền:** \`${formattedPrice}\`\n\n` +
        `**<a:7596clock:1511637183730290809> Thời gian:** ${dateStr}` +
        (confirmedByAdmin ? `\n\n**<a:setting:1507369942758985848> Chế độ Duyệt:** Thủ công bởi <@${adminId}>` : `\n\n**<a:tick2:1504811616636768288> Chế độ Duyệt:** Hệ thống tự động (SePay / PayOS)`);

    const detailsText = new TextDisplayBuilder().setContent(detailsContent);
    const footerText = new TextDisplayBuilder().setContent(`*Thập Cẩm Store • Automated Billing System*`);

    const container = new ContainerBuilder()
        .addComponents(
            section1,
            new SeparatorBuilder(),
            detailsText,
            new SeparatorBuilder(),
            footerText
        );

    return container.toJSON();
};
