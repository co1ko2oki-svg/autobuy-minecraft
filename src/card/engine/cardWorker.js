const { parentPort } = require('worker_threads');
const { generatePlayerCard, generateInvoiceCard } = require('./index');

parentPort.on('message', async (task) => {
    try {
        let buffer;
        if (task.type === 'player') {
            buffer = await generatePlayerCard(task.accountData, task.hypixelApiKey, task.donutApiKey, task.cardStyle);
        } else if (task.type === 'invoice') {
            buffer = await generateInvoiceCard(task.invoice, task.qrUrl, task.accountData);
        } else {
            throw new Error('Unknown task type: ' + task.type);
        }
        parentPort.postMessage({ id: task.id, ok: true, buffer });
    } catch (err) {
        parentPort.postMessage({ id: task.id, ok: false, error: err && err.message ? err.message : String(err) });
    }
});
