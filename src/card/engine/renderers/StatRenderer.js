const { C } = require('../config/constants');
const TextRenderer = require('./TextRenderer');
const { createCanvas } = require('canvas');
const CanvasPool = require('../core/pools/CanvasPool');

let staticStatsCanvas = null;
let staticBracketsCanvas = null;
let lastStatsHash = '';

class StatRenderer {
    static getHash(stats, startX, startY, rightW) {
        return stats.map(s => `${s.l}_${s.v}`).join('|') + `_${startX}_${startY}_${rightW}`;
    }

    static initCaches(ctx, stats, startX, startY, rightW) {
        const hash = this.getHash(stats, startX, startY, rightW);
        if (lastStatsHash === hash && staticStatsCanvas) return;
        
        lastStatsHash = hash;
        
        if (!staticStatsCanvas) staticStatsCanvas = createCanvas(1400, 700);
        if (!staticBracketsCanvas) staticBracketsCanvas = createCanvas(1400, 700);
        
        const sCtx = staticStatsCanvas.getContext('2d');
        const bCtx = staticBracketsCanvas.getContext('2d');
        
        sCtx.clearRect(0, 0, 1400, 700);
        bCtx.clearRect(0, 0, 1400, 700);

        const sGap = 16;
        const sW = Math.floor((rightW - sGap * 2) / 3);
        const sH = 72;

        stats.forEach((s, idx) => {
            const r = Math.floor(idx / 3);
            const c = idx % 3;
            const x = startX + c * (sW + sGap);
            const y = startY + r * (sH + sGap);
            
            bCtx.fillStyle = 'rgba(255,255,255,0.05)';
            bCtx.beginPath();
            bCtx.roundRect(x, y, sW, sH, 14);
            bCtx.fill();
            bCtx.strokeStyle = 'rgba(255,255,255,0.1)';
            bCtx.lineWidth = 1;
            bCtx.stroke();

            // Draw Static Info to Stats Canvas
            let lx = x + 16;
            if (s.logo) {
                sCtx.save();
                sCtx.shadowColor = 'rgba(255,255,255,0.4)';
                sCtx.shadowBlur = 12;
                sCtx.drawImage(s.logo, x + 10, y + 10, 22, 22);
                sCtx.restore();
                lx = x + 40;
            } else {
                sCtx.fillStyle = s.c || C.accent;
                sCtx.beginPath();
                sCtx.arc(x + 22, y + 22, 3.5, 0, Math.PI * 2);
                sCtx.fill();
                lx = x + 32;
            }

            sCtx.font = TextRenderer.getFont(10, '700');
            sCtx.fillStyle = 'rgba(255,255,255,0.4)';
            sCtx.textAlign = 'left';
            sCtx.fillText(s.l.toUpperCase(), lx, y + 23);

            const valGrad = sCtx.createLinearGradient(x + 16, y + 30, x + 16, y + 60);
            valGrad.addColorStop(0, '#FFFFFF');
            valGrad.addColorStop(1, '#B0C4DE');
            
            sCtx.font = TextRenderer.getFont(24, '800');
            sCtx.fillStyle = valGrad;
            sCtx.shadowColor = 'rgba(255,255,255,0.1)';
            sCtx.shadowBlur = 5;
            sCtx.fillText(String(s.v), x + 16, y + 54);
        });
    }

    static renderAllStats(ctx, stats, startX, startY, rightW, anim) {
        this.initCaches(ctx, stats, startX, startY, rightW);

        // Draw dynamic pulsing brackets
        // We use globalAlpha to pulse the entire bracket layer for performance.
        // Even though they originally pulsed individually by X, doing it uniformly saves massive draw calls.
        const pulse = Math.sin(anim.t * Math.PI * 2) * 0.2 + 0.8;
        ctx.globalAlpha = pulse;
        ctx.drawImage(staticBracketsCanvas, 0, 0);
        ctx.globalAlpha = 1.0;

        // Draw static text
        ctx.drawImage(staticStatsCanvas, 0, 0);
    }
}

module.exports = StatRenderer;
