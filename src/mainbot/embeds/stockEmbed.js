const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class ContainerBuilder {
    constructor() { this.data = { type: 17, components: [] }; }
    addComponents(...components) {
        this.data.components.push(...components.map(c => c.toJSON ? c.toJSON() : c));
        return this;
    }
    toJSON() { return this.data; }
}

class SectionBuilder {
    constructor() { this.data = { type: 9, components: [] }; }
    addComponents(...components) {
        this.data.components.push(...components.map(c => c.toJSON ? c.toJSON() : c));
        return this;
    }
    setAccessory(accessory) {
        this.data.accessory = accessory.toJSON ? accessory.toJSON() : accessory;
        return this;
    }
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
    constructor(isGallery = false) {
        this.data = { type: isGallery ? 12 : 11 };
    }
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

module.exports = function buildStockEmbed(account, actionRow = null, hasImage = true, status = 'available') {
    const formattedPrice = String(account.price).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + ' VNĐ';
    const rankText = account.rank ? account.rank.toUpperCase() : 'NON';
    const capesText = account.capes ? account.capes : 'Không';

    let statusEmoji = '<a:X_offline:1495443563025268807>  Có Sẵn';
    if (status === 'pending') {
        statusEmoji = '<a:Blink:1523329369504874638>  Đang Giao Dịch';
    } else if (status === 'sold') {
        statusEmoji = '🔴  Đã Bán';
    }

    const sectionText = new TextDisplayBuilder().setContent(`**<a:as_minecraft:1498013150715445258>  ${account.username}**\n💳  **Giá:** ${formattedPrice}\n<a:catjump:1495799390085054464>  **Trạng thái:** ${statusEmoji}`);
    const sectionThumbnail = new ThumbnailBuilder(false).setURL(process.env.EMBED_FOOTER_ICON_URL || 'https://cdn.discordapp.com/attachments/1494640480078794972/1525112628312277087/png.png?ex=6a523351&is=6a50e1d1&hm=4063ff7e3b35b22e944238bed050280ca33e84e32293f0451e99d55631d40784&');

    const section = new SectionBuilder()
        .addComponents(sectionText)
        .setAccessory(sectionThumbnail);

    const detailsText = new TextDisplayBuilder().setContent(`**<:7577nametag:1511637363804082327>  Username:** \`${account.username}\`\n**<a:tcmccapesminecoin:1499262575525892208>  Cape:** \`${capesText}\`\n**<a:Blink:1523329369504874638>  Rank:** \`${rankText}\``);

    const footerTextString = process.env.EMBED_FOOTER_TEXT || '*THẬP CẨM STORE • Secure Marketplace*';
    const footerText = new TextDisplayBuilder().setContent(footerTextString);

    const container = new ContainerBuilder();
    
    if (hasImage) {
        const heroImage = new ThumbnailBuilder(true).setURL('attachment://stats-card.gif');
        container.addComponents(heroImage, new SeparatorBuilder());
    }

    container.addComponents(
        section,
        new SeparatorBuilder(),
        detailsText,
        new SeparatorBuilder()
    );

    if (actionRow) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId('show_tos')
                .setLabel('📝 Xem TOS')
                .setStyle(ButtonStyle.Secondary)
        );
        container.addComponents(actionRow);
    }

    container.addComponents(footerText);

    return container.toJSON();
};
