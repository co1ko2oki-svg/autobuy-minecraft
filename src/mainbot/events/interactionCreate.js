const { MessageFlags } = require('discord.js');
const invoicePayment = require('../payments/invoice');
const { buildCardModal } = require('../embeds/cardModal');
const { buildHelpPanel } = require('../embeds/helpEmbed');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) {
                console.error(`[Command] Không tìm thấy lệnh /${interaction.commandName}`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`[Command] Lỗi thực thi /${interaction.commandName}:`, error);
                const replyObj = { content: 'Có lỗi xảy ra khi thực hiện lệnh này!', flags: MessageFlags.Ephemeral };
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp(replyObj);
                    } else {
                        await interaction.reply(replyObj);
                    }
                } catch (fallbackError) {
                    console.error('[Command] Lỗi gửi phản hồi fallback:', fallbackError);
                }
            }
        } else if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command || !command.autocomplete) return;

            try {
                await command.autocomplete(interaction);
            } catch (error) {
                console.error(`[Autocomplete] Lỗi xử lý /${interaction.commandName}:`, error);
            }
        } else if (interaction.isButton()) {
            const buttonId = interaction.customId;
            let actionKey = buttonId;
            let args = [];

            if (buttonId.startsWith('buy_') && buttonId !== 'buy_again') {
                actionKey = 'buy';
                args = [buttonId.replace('buy_', '')];
            } else if (buttonId.startsWith('admin_confirm_')) {
                actionKey = 'admin_confirm';
                args = [buttonId.replace('admin_confirm_', '')];
            } else if (buttonId.startsWith('check_payment_')) {
                actionKey = 'check_payment';
                args = [buttonId.replace('check_payment_', '')];
            } else if (buttonId.startsWith('cancel_invoice_')) {
                actionKey = 'cancel_invoice';
                args = [buttonId.replace('cancel_invoice_', '')];
            } else if (buttonId.startsWith('pay_card_')) {
                actionKey = 'pay_card';
                args = [buttonId.replace('pay_card_', '')];
            }

            const buttonHandlers = {
                'buy': async (i, a) => invoicePayment.handleBuyButton(i, a[0]),
                'admin_confirm': async (i) => invoicePayment.handleAdminConfirm(i),
                'pay_card': async (i, a) => i.showModal(buildCardModal(a[0])),
                'check_payment': async (i, a) => invoicePayment.checkPaymentStatus(i, a[0]),
                'cancel_invoice': async (i, a) => invoicePayment.cancelInvoice(i, a[0]),
                'buy_again': async (i) => i.reply({ content: 'Vui lòng quay lại kênh stock để chọn tài khoản khác!', flags: MessageFlags.Ephemeral }),
                'show_tos': async (i) => i.reply({ components: [invoicePayment.buildTosComponent()], flags: 32768 | MessageFlags.Ephemeral }),
                'help_home': async (i) => {
                    await i.update({ components: [buildHelpPanel('home', i)] }).catch(() => {});
                }
            };

            try {
                if (buttonHandlers[actionKey]) {
                    await buttonHandlers[actionKey](interaction, args);
                }
            } catch (error) {
                console.error(`[Button] Lỗi xử lý nút ${buttonId}:`, error);
                const replyObj = { content: '❌ Đã xảy ra lỗi khi xử lý nút bấm này.', flags: MessageFlags.Ephemeral };
                if (!interaction.replied && !interaction.deferred) await interaction.reply(replyObj).catch(() => {});
                else await interaction.followUp(replyObj).catch(() => {});
            }
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('submit_card_')) {
                const invoiceId = interaction.customId.replace('submit_card_', '');
                await invoicePayment.handleCardSubmit(interaction, invoiceId);
            }
        } else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'help_menu') {
                const selected = interaction.values[0];
                try {
                    await interaction.update({ components: [buildHelpPanel(selected, interaction)] });
                } catch (e) {
                    console.error('[SelectMenu] Lỗi cập nhật help_menu:', e);
                }
            }
        }
    }
};
