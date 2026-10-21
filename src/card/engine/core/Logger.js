class Logger {
    static log(message, meta = {}) {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? meta : '');
    }

    static error(message, err = null) {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
        if (err) console.error(err);
    }

    static warn(message) {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
    }
}

module.exports = Logger;
