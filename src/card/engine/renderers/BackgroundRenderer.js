const { W, H } = require('../config/constants');
const CanvasPool = require('../core/pools/CanvasPool');
const { createCanvas } = require('canvas');

let staticOverlay = null;
let staticFlare = null;

class BackgroundRenderer {
    static initCaches() {
        if (staticOverlay) return;

        staticOverlay = createCanvas(W, H);
        const overlayCtx = staticOverlay.getContext('2d');

        // Cyber-Luxury intense vignette
        const g = overlayCtx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.8);
        g.addColorStop(0, 'rgba(10, 10, 12, 0)');
        g.addColorStop(0.5, 'rgba(10, 10, 12, 0.4)');
        g.addColorStop(1, 'rgba(5, 5, 6, 0.95)');
        overlayCtx.fillStyle = g;
        overlayCtx.fillRect(0, 0, W, H);

        // Subtle Brand Watermark
        overlayCtx.save();
        overlayCtx.translate(W / 2, H / 2);
        overlayCtx.rotate(-Math.PI / 12);
        overlayCtx.font = '900 180px "Inter", "Segoe UI", sans-serif';
        overlayCtx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        overlayCtx.textAlign = 'center';
        overlayCtx.textBaseline = 'middle';
        overlayCtx.fillText('THẬP CẨM', 0, 0);
        overlayCtx.restore();

        // Static Flare (Max opacity)
        staticFlare = createCanvas(W, H);
        const flareCtx = staticFlare.getContext('2d');
        const flareGrad = flareCtx.createRadialGradient(W * 0.3, H * 0.4, 0, W * 0.3, H * 0.4, W * 0.6);
        flareGrad.addColorStop(0, `rgba(88, 255, 214, 1)`); // Base max cyan
        flareGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        flareCtx.fillStyle = flareGrad;
        flareCtx.fillRect(0, 0, W, H);
    }

    static render(ctx, bgFrames, anim) {
        if (!staticOverlay) this.initCaches();

        if (bgFrames && bgFrames.length > 0) {
            const b = bgFrames[Math.floor(anim.t * bgFrames.length) % bgFrames.length];
            const sc = Math.max(W / b.width, H / b.height);
            const parallaxScale = 1.05;
            const shiftX = Math.sin(anim.t * Math.PI * 2) * 15;
            const shiftY = Math.cos(anim.t * Math.PI * 2) * 15;
            
            ctx.drawImage(b, 
                (W - b.width * sc * parallaxScale) / 2 + shiftX, 
                (H - b.height * sc * parallaxScale) / 2 + shiftY, 
                b.width * sc * parallaxScale, 
                b.height * sc * parallaxScale
            );
        } else {
            ctx.fillStyle = '#0a0a0c'; // darker, cooler luxury base
            ctx.fillRect(0, 0, W, H);
        }

        // Draw cached vignette and watermark
        ctx.drawImage(staticOverlay, 0, 0);

        // Animated Ambient Core Light (Flare) using globalAlpha
        const pulse = anim.pulse(1);
        ctx.globalAlpha = 0.15 + pulse * 0.05;
        ctx.drawImage(staticFlare, 0, 0);
        ctx.globalAlpha = 1.0;
    }
}

module.exports = BackgroundRenderer;
