const { ActivityType, Events } = require('discord.js');
const { startPaymentCheckLoop: startInvoicePaymentLoop, recoverOrphanedAccounts } = require('../payments/invoice');
const { startLeaderboardLoop } = require('../utils/leaderboardUpdater');

module.exports = {
    name: Events.ClientReady || 'ready',
    once: true,
    async execute(client) {
        console.log(`[Bot] Ready! Logged in as ${client.user.tag}`);
        client.user.setActivity('AutoBuy Minecraft Accounts', { type: ActivityType.Watching });

        if (typeof recoverOrphanedAccounts === 'function') recoverOrphanedAccounts(client);
        if (typeof startInvoicePaymentLoop === 'function') startInvoicePaymentLoop(client);
        if (typeof startLeaderboardLoop === 'function') startLeaderboardLoop(client);

        console.log(`[Bot] Bắt đầu vào trạng thái hoạt động.`);
    },
};
