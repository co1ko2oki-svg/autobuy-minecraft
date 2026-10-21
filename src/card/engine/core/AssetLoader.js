const { loadImage, registerFont } = require('canvas');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const Logger = require('./Logger');
const CacheManager = require('./CacheManager');
const { FRAMES } = require('../config/constants');
const gifFrames = require('gif-frames');

class AssetLoader {
    static async initFonts() {
        try {
            const fontPath = path.join(__dirname, '../../../fonts/MinecraftRegular.otf');
            if (fs.existsSync(fontPath)) {
                registerFont(fontPath, { family: 'MC' });
                Logger.log('Font loaded successfully');
            }
        } catch (e) {
            Logger.warn('Failed to load custom font, falling back to system fonts');
        }
    }

    static async loadBackground() {
        const cacheKey = 'bg_frames';
        if (CacheManager.getCache('backgrounds').has(cacheKey)) {
            return CacheManager.getCache('backgrounds').get(cacheKey);
        }

        let bg = [];
        try {
            const bgPath = path.join(__dirname, '../../../backgrounds');
            let hasGif = false;
            
            if (fs.existsSync(bgPath)) {
                const files = fs.readdirSync(bgPath);
                const gifFile = files.find(f => f.endsWith('.gif'));
                if (gifFile) {
                    hasGif = true;
                    const frameData = await gifFrames({ url: path.join(bgPath, gifFile), frames: 'all', outputType: 'png', cumulative: true });
                    for (const f of frameData) {
                        const s = f.getImage();
                        const buf = await new Promise((res, rej) => {
                            const c = [];
                            s.on('data', d => c.push(d));
                            s.on('end', () => res(Buffer.concat(c)));
                            s.on('error', rej);
                        });
                        bg.push(await loadImage(buf));
                    }
                } else {
                    const imgFiles = files.filter(f => f.match(/\.(png|jpg|jpeg|webp)$/i));
                    if (imgFiles.length > 0) {
                        const img = await loadImage(path.join(bgPath, imgFiles[0]));
                        bg = [img];
                    }
                }
            }
            CacheManager.getCache('backgrounds').set(cacheKey, bg);
            return bg;
        } catch (e) {
            Logger.error('Failed to load background', e);
            return [];
        }
    }

    static async loadLogos() {
        const cacheKey = 'logos';
        if (CacheManager.getCache('logos').has(cacheKey)) {
            return CacheManager.getCache('logos').get(cacheKey);
        }

        let logo, hpL, dnL;
        const promises = [
            loadImage(path.join(__dirname, '../../../logo/ThapCamlogo.png')).catch(() => null),
            (async () => {
                let p = path.join(__dirname, '../../../logo/hypixellogo.png');
                if (!fs.existsSync(p)) p = p.replace('.png', '.webp');
                return fs.existsSync(p) ? loadImage(p) : null;
            })(),
            (async () => {
                let p = path.join(__dirname, '../../../logo/donutsmplogo.png');
                if (fs.existsSync(p)) return loadImage(p);
                try {
                    const imgRes = await axios.get('https://cdn3.emoji.gg/emojis/1382-donutsmp-logo.png', {
                        responseType: 'arraybuffer',
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    return loadImage(imgRes.data);
                } catch (e) { return null; }
            })()
        ];

        [logo, hpL, dnL] = await Promise.all(promises);
        const result = { logo, hpL, dnL };
        CacheManager.getCache('logos').set(cacheKey, result);
        return result;
    }

    static async loadSkins(username) {
        const cacheKey = `skin_${username}`;
        if (CacheManager.getCache('skins').has(cacheKey)) {
            return CacheManager.getCache('skins').get(cacheKey);
        }

        let skins = [];
        try {
            const skin = await loadImage(`https://visage.surgeplay.com/full/512/${username}?y=25`);
            skins.push(skin);
        } catch (e) {
            Logger.error('Failed to load skin from Visage API', e);
        }

        if (!skins || skins.length === 0) {
            try { skins = [await loadImage('https://visage.surgeplay.com/full/512/Steve')]; } catch (e) { }
        }

        CacheManager.getCache('skins').set(cacheKey, skins);
        return skins;
    }

    static async loadCapes(rawCapeList) {
        if (!rawCapeList || rawCapeList.length === 0) return [];
        
        const cacheStr = rawCapeList.join(',');
        if (CacheManager.getCache('capes').has(cacheStr)) {
            return CacheManager.getCache('capes').get(cacheStr);
        }

        const promises = rawCapeList.map(async c => {
            try {
                const p = path.join(__dirname, `../../../cape/${c}.png`);
                if (fs.existsSync(p)) return { name: c, img: await loadImage(p) };
                return { name: c, img: null };
            } catch (e) {
                return { name: c, img: null };
            }
        });

        const capes = await Promise.all(promises);
        CacheManager.getCache('capes').set(cacheStr, capes);
        return capes;
    }
}

module.exports = AssetLoader;
