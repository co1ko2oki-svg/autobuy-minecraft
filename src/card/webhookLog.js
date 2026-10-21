async function sendStockLog(accounts, authorName, authorId) {
    try {
        console.log(`[StockLog] Đã thêm ${accounts.length} accounts. Người thực hiện: ${authorName} (${authorId})`);
    } catch (error) {
        console.error('[StockLog] Lỗi khi xử lý sendStockLog:', error.message);
    }
}

module.exports = {
    sendStockLog
};
