const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function buildCardModal(invoiceId) {
    const modal = new ModalBuilder()
        .setCustomId(`submit_card_${invoiceId}`)
        .setTitle('Thanh Toán Bằng Thẻ Cào');

    const telcoInput = new TextInputBuilder()
        .setCustomId('card_telco')
        .setLabel('Nhà mạng (VIETTEL, MOBIFONE, VINAPHONE)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('VD: VIETTEL')
        .setRequired(true);

    const amountInput = new TextInputBuilder()
        .setCustomId('card_amount')
        .setLabel('Mệnh giá thẻ (VD: 10000, 50000, 100000)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Chỉ ghi số, VD: 100000')
        .setRequired(true);

    const serialInput = new TextInputBuilder()
        .setCustomId('card_serial')
        .setLabel('Số Serial thẻ')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const pinInput = new TextInputBuilder()
        .setCustomId('card_pin')
        .setLabel('Mã thẻ (PIN)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(telcoInput),
        new ActionRowBuilder().addComponents(amountInput),
        new ActionRowBuilder().addComponents(serialInput),
        new ActionRowBuilder().addComponents(pinInput)
    );

    return modal;
}

module.exports = { buildCardModal };
