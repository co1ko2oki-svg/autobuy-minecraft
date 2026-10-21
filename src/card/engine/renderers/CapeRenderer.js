const { C } = require('../config/constants');
const { createCanvas } = require('canvas');
const CanvasPool = require('../core/pools/CanvasPool');

const CAPE_W = 48;
const CAPE_H = 72;
const cachedCapeCanvases = new Map();
let staticGlowCanvas = null;
let lastCapesHash = '';

class CapeRenderer {
    static getHash(capes) {
        if (!capes) return '';
        return capes.map(c => c.name).join('|');
    }

    static initCaches(capes) {
        const hash = this.getHash(capes);
        if (lastCapesHash === hash) return;
        lastCapesHash = hash;

        // Clear old caches
        cachedCapeCanvases.clear();

        if (!staticGlowCanvas) {
            staticGlowCanvas = createCanvas(CAPE_W * 3, CAPE_W * 3);
            const gCtx = staticGlowCanvas.getContext('2d');
            const shadow = gCtx.createRadialGradient(CAPE_W * 1.5, CAPE_W * 1.5, 5, CAPE_W * 1.5, CAPE_W * 1.5, CAPE_W * 1.5);
            shadow.addColorStop(0, `rgba(88, 255, 214, 0.3)`);
            shadow.addColorStop(1, 'rgba(88, 255, 214, 0)');
            gCtx.fillStyle = shadow;
            gCtx.beginPath();
            gCtx.arc(CAPE_W * 1.5, CAPE_W * 1.5, CAPE_W * 1.5, 0, Math.PI * 2);
            gCtx.fill();
        }

        if (!capes) return;

        for (const cape of capes) {
            // Draw each cape onto its own small canvas
            const canvas = createCanvas(CAPE_W + 4, CAPE_H + 4); // padding for stroke
            const ctx = canvas.getContext('2d');
            
            const cx = CAPE_W / 2 + 2;
            const cy = CAPE_H / 2 + 2;

            ctx.fillStyle = 'rgba(10, 15, 20, 0.8)';
            ctx.beginPath();
            ctx.roundRect(2, 2, CAPE_W, CAPE_H, 6);
            ctx.fill();

            if (cape.img) {
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(5, 5, CAPE_W - 6, CAPE_H - 6, 4);
                ctx.clip();
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(cape.img, 5, 5, CAPE_W - 6, CAPE_H - 6);
                ctx.imageSmoothingEnabled = true;
                ctx.restore();
            }

            ctx.strokeStyle = `rgba(255,255,255,0.1)`;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // We need a second canvas for the glowing stroke state
            const canvasGlow = createCanvas(CAPE_W + 4, CAPE_H + 4);
            const ctxGlow = canvasGlow.getContext('2d');
            ctxGlow.drawImage(canvas, 0, 0);
            ctxGlow.strokeStyle = `rgba(255,255,255,0.5)`; // High intensity
            ctxGlow.lineWidth = 1.5;
            ctxGlow.beginPath();
            ctxGlow.roundRect(2, 2, CAPE_W, CAPE_H, 6);
            ctxGlow.stroke();

            cachedCapeCanvases.set(cape.name, {
                base: canvas,
                glow: canvasGlow
            });
        }
    }

    static renderSlot(ctx, x, y, angle, capeName, glow, animTime, zIndexOffset) {
        const floatY = Math.sin(animTime * Math.PI * 2 + zIndexOffset) * 4;
        const cache = cachedCapeCanvases.get(capeName);
        if (!cache) return;

        ctx.save();
        ctx.translate(x, y + floatY);
        ctx.rotate(angle);
        
        if (glow > 0.1) {
            ctx.globalAlpha = glow;
            ctx.drawImage(staticGlowCanvas, -CAPE_W * 1.5, -CAPE_W * 1.5);
            ctx.globalAlpha = 1.0;
        }

        // Draw base
        ctx.drawImage(cache.base, -CAPE_W/2 - 2, -CAPE_H/2 - 2);
        
        // Add glow stroke overlay if glowing
        if (glow > 0.05) {
            ctx.globalAlpha = glow;
            ctx.drawImage(cache.glow, -CAPE_W/2 - 2, -CAPE_H/2 - 2);
            ctx.globalAlpha = 1.0;
        }

        ctx.restore();
    }

    static renderGrid(ctx, capes, startX, startY, animationController) {
        this.initCaches(capes);

        if (!capes || capes.length === 0) return;
        
        const totalCapes = capes.length;
        const columns = Math.min(totalCapes, 7);
        const gapX = 64; 
        const gapY = 88; 

        for (let i = 0; i < totalCapes; i++) {
            const row = Math.floor(i / columns);
            const col = i % columns;
            const angle = 0;
            const sx = startX + 40 + (col * gapX);
            const sy = startY + 40 + (row * gapY);
            
            const scanPos = animationController.scan(totalCapes * 1.5, 0); 
            const dist = Math.abs(i - scanPos);
            const glow = dist < 1.0 ? (1 - dist) : 0;
            
            const capeData = capes[i];
            if (capeData) {
                this.renderSlot(ctx, sx, sy, angle, capeData.name, glow, animationController.t, i);
            }
        }
    }
}

module.exports = CapeRenderer;
