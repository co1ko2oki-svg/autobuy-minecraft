const { PX, PY, PH, LEFT_W, C } = require('../config/constants');
const { createCanvas } = require('canvas');
const CanvasPool = require('../core/pools/CanvasPool');

let staticDivider = null;
let staticNodeGlow = null;
let staticPlatformGlow = null;

class LightingRenderer {
    static initCaches() {
        if (staticDivider) return;

        // 1. Static Divider Line
        staticDivider = createCanvas(4, PH);
        const dCtx = staticDivider.getContext('2d');
        const divGrad = dCtx.createLinearGradient(0, 40, 0, PH - 40);
        divGrad.addColorStop(0, 'rgba(77, 163, 255, 0)');
        divGrad.addColorStop(0.3, 'rgba(77, 163, 255, 0.15)');
        divGrad.addColorStop(0.5, 'rgba(88, 255, 214, 0.2)');
        divGrad.addColorStop(0.7, 'rgba(77, 163, 255, 0.15)');
        divGrad.addColorStop(1, 'rgba(77, 163, 255, 0)');
        dCtx.strokeStyle = divGrad;
        dCtx.lineWidth = 1.5;
        dCtx.beginPath();
        dCtx.moveTo(2, 40);
        dCtx.lineTo(2, PH - 40);
        dCtx.stroke();

        // 2. Static Node Glow
        staticNodeGlow = createCanvas(80, 80);
        const nCtx = staticNodeGlow.getContext('2d');
        const gGlow = nCtx.createRadialGradient(40, 40, 0, 40, 40, 40);
        gGlow.addColorStop(0, `rgba(88, 255, 214, 1)`); // Max opacity
        gGlow.addColorStop(1, 'rgba(88, 255, 214, 0)');
        nCtx.fillStyle = gGlow;
        nCtx.beginPath();
        nCtx.arc(40, 40, 40, 0, Math.PI * 2);
        nCtx.fill();
        nCtx.fillStyle = `rgba(255, 255, 255, 1)`;
        nCtx.beginPath();
        nCtx.arc(40, 40, 2, 0, Math.PI * 2);
        nCtx.fill();

        // 3. Static Platform Glow Base (Radius 120 + 50 = 170)
        staticPlatformGlow = createCanvas(400, 100);
        const pCtx = staticPlatformGlow.getContext('2d');
        const pGlow = pCtx.createRadialGradient(200, 50, 0, 200, 50, 170);
        pGlow.addColorStop(0, `rgba(77, 163, 255, 1)`); // Max opacity
        pGlow.addColorStop(1, 'rgba(77, 163, 255, 0)');
        
        pCtx.fillStyle = pGlow;
        pCtx.beginPath();
        pCtx.ellipse(200, 50, 170, 170 * 0.25, 0, 0, Math.PI * 2);
        pCtx.fill();
        
        pCtx.fillStyle = 'rgba(255,255,255,0.05)';
        pCtx.beginPath();
        pCtx.ellipse(200, 50, 100, 100 * 0.25, 0, 0, Math.PI * 2);
        pCtx.fill();
        
        pCtx.fillStyle = `rgba(88, 255, 214, 0.5)`;
        pCtx.beginPath();
        pCtx.ellipse(200, 50, 48, 48 * 0.25, 0, 0, Math.PI * 2);
        pCtx.fill();
    }

    static renderDividers(ctx, animationController) {
        if (!staticDivider) this.initCaches();
        ctx.save();

        const divX = PX + LEFT_W;
        
        ctx.drawImage(staticDivider, divX - 2, PY);

        // Pulsing glowing nodes removed for clean look
        
        ctx.restore();
    }

    static renderPlatformGlow(ctx, x, y, radius, animationController) {
        if (!staticPlatformGlow) this.initCaches();
        ctx.save();

        const pulse = animationController.platformPulse();
        const r1 = radius + pulse.radiusMod;
        const shiftX = Math.sin(animationController.t * Math.PI * 2) * 15;
        
        const scaleMod = r1 / radius;
        const drawW = 400 * scaleMod;
        const drawH = 100 * scaleMod;

        ctx.globalAlpha = pulse.opacity;
        ctx.drawImage(staticPlatformGlow, x + shiftX - drawW/2, y - drawH/2, drawW, drawH);

        ctx.restore();
    }
}

module.exports = LightingRenderer;
