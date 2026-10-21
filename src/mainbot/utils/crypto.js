const crypto = require('crypto');
require('dotenv').config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16;

function encrypt(text) {
    if (!text) return text;
    const keyBuffer = Buffer.from(ENCRYPTION_KEY.length === 64 ? ENCRYPTION_KEY : ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32), 'utf-8');
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    if (!text || !text.includes(':')) return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const keyBuffer = Buffer.from(ENCRYPTION_KEY.length === 64 ? ENCRYPTION_KEY : ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32), 'utf-8');
        const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (e) {
        console.error('Lỗi giải mã:', e);
        return text;
    }
}

module.exports = { encrypt, decrypt };
