const { Worker } = require('worker_threads');
const path = require('path');
const CacheManager = require('./CacheManager');
const AnimationController = require('./AnimationController');
const Logger = require('./Logger');
const { W, H, SCALE, OUT_W, OUT_H, FRAMES, DELAY } = require('../config/constants');
const BackgroundRenderer = require('../renderers/BackgroundRenderer');
const GlassRenderer = require('../renderers/GlassRenderer');
const { normalizePrice } = require('../../../mainbot/utils/helpers');
const CanvasPool = require('./pools/CanvasPool');

const outPool = new CanvasPool(OUT_W, OUT_H, 2);
const renderPool = new CanvasPool(W, H, 1);

class RenderPipeline {
    static getCacheKey(accountData, stats) {
        return `${accountData.username}_${accountData.rank}_${stats.level}_${stats.money}_${accountData.capes}`;
    }

    static renderGlassBase() {
        const cacheKey = 'glassBase';
        if (CacheManager.getCache('staticLayers').has(cacheKey)) {
            return CacheManager.getCache('staticLayers').get(cacheKey);
        }

        const canvas = renderPool.acquire();
        const ctx = canvas.getContext('2d');
        GlassRenderer.renderStaticPanel(ctx);

        const cachedCanvas = require('canvas').createCanvas(W, H);
        cachedCanvas.getContext('2d').drawImage(canvas, 0, 0);
        CacheManager.getCache('staticLayers').set(cacheKey, cachedCanvas);
        renderPool.release(canvas);
        
        return cachedCanvas;
    }

    static async encodeGIF(accountData, stats, assets) {
        const priceNum = normalizePrice(accountData.price || '0');
        
        return new Promise((resolve, reject) => {
            const workerPath = path.join(__dirname, 'workers/EncoderWorker.js');
            const worker = new Worker(workerPath);

            worker.on('message', async (msg) => {
                if (msg.type === 'ready') {
                    const anim = new AnimationController(0);
                    const outCanvas = outPool.acquire();
                    try {
                        const outCtx = outCanvas.getContext('2d');

                        for (let i = 0; i < FRAMES; i++) {
                            anim.t = i / FRAMES;
                            outCtx.clearRect(0, 0, OUT_W, OUT_H);
                            outCtx.imageSmoothingEnabled = true;
                            outCtx.imageSmoothingQuality = 'high';

                            outCtx.save();
                            outCtx.scale(SCALE, SCALE);

                            BackgroundRenderer.render(outCtx, assets.bgFrames, anim);
                            
                            const bgGrad = outCtx.createRadialGradient(W/2, H/2, H/2, W/2, H/2, W);
                            bgGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
                            bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
                            outCtx.fillStyle = bgGrad;
                            outCtx.fillRect(0, 0, W, H);

                            const cX = 120, cY = 70, cW = 1160, cH = 560;
                            const GLASS_BG = 'rgba(255, 255, 255, 0.1)';
                            const GLASS_BORDER = 'rgba(255, 255, 255, 0.2)';
                            const TEXT_MAIN = '#FFFFFF';
                            const TEXT_SEC = 'rgba(255, 255, 255, 0.7)';
                            
                            outCtx.save();
                            outCtx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                            outCtx.shadowBlur = 40;
                            outCtx.shadowOffsetY = 20;
                            outCtx.fillStyle = GLASS_BG;
                            outCtx.beginPath();
                            outCtx.roundRect(cX, cY, cW, cH, 30);
                            outCtx.fill();
                            outCtx.shadowColor = 'transparent';
                            
                            outCtx.strokeStyle = GLASS_BORDER;
                            outCtx.lineWidth = 2;
                            outCtx.stroke();
                            outCtx.restore();

                            if (assets.skins && assets.skins.length > 0) {
                                const skin = assets.skins[0];
                                const floatY = Math.sin(anim.t * Math.PI * 2) * 12;
                                const sw = 320;
                                const sh = sw * (skin.height / skin.width);
                                const sX = cX + 80;
                                const sY = cY + (cH - sh) / 2 + floatY;
                                
                                outCtx.save();
                                outCtx.shadowColor = 'rgba(0,0,0,0.4)';
                                outCtx.shadowBlur = 20;
                                outCtx.shadowOffsetY = 15;
                                outCtx.drawImage(skin, sX, sY, sw, sh);
                                outCtx.restore();
                            }

                            const textX = cX + 460;
                            let textY = cY + 50;

                            outCtx.font = 'bold 54px "Segoe UI", sans-serif';
                            outCtx.fillStyle = TEXT_MAIN;
                            outCtx.shadowColor = 'rgba(0,0,0,0.3)';
                            outCtx.shadowBlur = 10;
                            outCtx.fillText(accountData.username, textX, textY);
                            outCtx.shadowColor = 'transparent';

                            textY += 45;
                            const rankText = (accountData.rank || 'MEMBER').toUpperCase();
                            
                            outCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                            outCtx.beginPath();
                            outCtx.roundRect(textX, textY - 25, 140, 36, 18);
                            outCtx.fill();
                            
                            outCtx.font = 'bold 16px "Segoe UI", sans-serif';
                            outCtx.fillStyle = '#FFD700';
                            outCtx.textAlign = 'center';
                            outCtx.fillText(rankText, textX + 70, textY - 2);

                            outCtx.fillStyle = 'rgba(16, 185, 129, 0.2)';
                            outCtx.beginPath();
                            outCtx.roundRect(textX + 160, textY - 25, 120, 36, 18);
                            outCtx.fill();
                            outCtx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
                            outCtx.stroke();
                            
                            outCtx.fillStyle = '#10B981';
                            outCtx.fillText('✔ 100% LEGIT', textX + 220, textY - 2);
                            outCtx.textAlign = 'left';

                            textY += 45;
                            const priceBoxW = 440, priceBoxH = 75;
                            outCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                            outCtx.beginPath();
                            outCtx.roundRect(textX, textY, priceBoxW, priceBoxH, 16);
                            outCtx.fill();
                            outCtx.strokeStyle = 'rgba(255,255,255,0.1)';
                            outCtx.stroke();
                            
                            const bankPriceNum = priceNum;
                            const cardPriceNum = Math.round(priceNum * 1.25 / 1000) * 1000;
                            
                            const bankPriceStr = bankPriceNum === 0 ? '0' : bankPriceNum.toLocaleString('vi-VN') + 'đ';
                            const cardPriceStr = cardPriceNum === 0 ? '0' : cardPriceNum.toLocaleString('vi-VN') + 'đ';

                            outCtx.font = '600 13px "Segoe UI", sans-serif';
                            outCtx.fillStyle = TEXT_SEC;
                            outCtx.textAlign = 'center';
                            outCtx.fillText('GIÁ BANK', textX + 110, textY + 25);
                            outCtx.fillText('GIÁ THẺ CÀO', textX + 330, textY + 25);
                            
                            outCtx.font = 'bold 26px "Segoe UI", sans-serif';
                            outCtx.fillStyle = '#10B981';
                            outCtx.fillText(bankPriceStr, textX + 110, textY + 55);
                            outCtx.fillStyle = '#F59E0B';
                            outCtx.fillText(cardPriceStr, textX + 330, textY + 55);
                            outCtx.textAlign = 'left';

                            textY += priceBoxH + 30;
                            outCtx.font = '600 18px "Segoe UI", sans-serif';
                            outCtx.fillStyle = TEXT_MAIN;
                            
                            const totalCapes = (accountData.parsedCapes ? accountData.parsedCapes.length : 0);
                            outCtx.fillText(`Cosmetics & Capes (${totalCapes})`, textX, textY);
                            
                            let capeY = textY + 20;
                            let capeX = textX;
                            
                            if (assets.capes && assets.capes.length > 0) {
                                for (let c = 0; c < assets.capes.length; c++) {
                                    const cape = assets.capes[c];
                                    const capeName = cape.name;
                                    outCtx.font = '600 15px "Segoe UI", sans-serif';
                                    const metrics = outCtx.measureText(capeName);
                                    const pillW = metrics.width + 65; 
                                    
                                    if (capeX + pillW > cX + cW - 40) {
                                        capeX = textX;
                                        capeY += 60;
                                        if (capeY > cY + cH - 20) break;
                                    }
                                    
                                    outCtx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                                    outCtx.beginPath();
                                    outCtx.roundRect(capeX, capeY, pillW, 50, 25);
                                    outCtx.fill();
                                    outCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                                    outCtx.stroke();
                                    
                                    if (cape.img) {
                                        outCtx.drawImage(cape.img, capeX + 10, capeY + 5, 25, 40);
                                    }
                                    
                                    outCtx.fillStyle = TEXT_MAIN;
                                    outCtx.fillText(capeName, capeX + 55, capeY + 31);
                                    
                                    capeX += pillW + 15;
                                }
                            } else if (accountData.parsedCapes && accountData.parsedCapes.length > 0) {
                                for (let c = 0; c < accountData.parsedCapes.length; c++) {
                                    const capeName = accountData.parsedCapes[c].trim();
                                    outCtx.font = '14px "Segoe UI", sans-serif';
                                    const metrics = outCtx.measureText(capeName);
                                    const pillW = metrics.width + 30;
                                    
                                    if (capeX + pillW > cX + cW - 40) {
                                        capeX = textX;
                                        capeY += 40;
                                        if (capeY > cY + cH - 20) break;
                                    }
                                    
                                    outCtx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                                    outCtx.beginPath();
                                    outCtx.roundRect(capeX, capeY, pillW, 30, 15);
                                    outCtx.fill();
                                    outCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                                    outCtx.stroke();
                                    
                                    outCtx.fillStyle = TEXT_MAIN;
                                    outCtx.fillText(capeName, capeX + 15, capeY + 20);
                                    
                                    capeX += pillW + 15;
                                }
                            } else {
                                outCtx.font = 'italic 16px "Segoe UI", sans-serif';
                                outCtx.fillStyle = TEXT_SEC;
                                outCtx.fillText('Không có', capeX, capeY + 20);
                            }
                            
                            outCtx.save();
                            outCtx.beginPath();
                            outCtx.roundRect(cX, cY, cW, cH, 30);
                            outCtx.clip();
                            
                            const shineX = (anim.t * 3 - 1) * cW + cX;
                            const shineGrad = outCtx.createLinearGradient(shineX, 0, shineX + 200, 0);
                            shineGrad.addColorStop(0, 'rgba(255,255,255,0)');
                            shineGrad.addColorStop(0.5, 'rgba(255,255,255,0.2)');
                            shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
                            
                            outCtx.translate(shineX + 100, cY + cH/2);
                            outCtx.rotate(Math.PI / 4);
                            outCtx.fillStyle = shineGrad;
                            outCtx.fillRect(-500, -1000, 200, 2000);
                            
                            outCtx.restore();
                            outCtx.restore();

                            const imageData = outCtx.getImageData(0, 0, OUT_W, OUT_H);
                            const pixelBuffer = new Uint8Array(imageData.data.buffer);
                            
                            worker.postMessage({ type: 'frame', pixels: pixelBuffer, width: OUT_W, height: OUT_H }, [pixelBuffer.buffer]);
                            await new Promise((res, rej) => {
                                const onMessage = (m) => {
                                    if (m.type === 'frameDone') {
                                        cleanup();
                                        res();
                                    } else if (m.type === 'error') {
                                        cleanup();
                                        rej(new Error(m.error));
                                    }
                                };
                                const onError = (err) => {
                                    cleanup();
                                    rej(err);
                                };
                                const cleanup = () => {
                                    worker.off('message', onMessage);
                                    worker.off('error', onError);
                                };
                                worker.on('message', onMessage);
                                worker.on('error', onError);
                            });
                        }

                        worker.postMessage({ type: 'finish' });
                    } catch (loopErr) {
                        worker.terminate();
                        reject(loopErr);
                    } finally {
                        outPool.release(outCanvas);
                    }
                } 
                else if (msg.type === 'done') {
                    worker.terminate();
                    resolve(Buffer.from(msg.buffer));
                }
                else if (msg.type === 'error') {
                    worker.terminate();
                    reject(new Error(msg.error));
                }
            });

            worker.on('error', reject);
            worker.postMessage({ type: 'init', width: OUT_W, height: OUT_H, delay: DELAY, quality: 10 });
        });
    }
}

module.exports = RenderPipeline;
