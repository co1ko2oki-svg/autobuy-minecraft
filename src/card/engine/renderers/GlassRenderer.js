const { W, H, PX, PY, PW, PH, PR, LEFT_W, RIGHT_X, RIGHT_W, C } = require('../config/constants');
const { createCanvas } = require('canvas');

let staticShine = null;

class GlassRenderer {
    static initShine() {
        if (staticShine) return;
        
        // The shine moves diagonally across W. We make a canvas 3x W to allow sliding it.
        staticShine = createCanvas(W * 3, H);
        const ctx = staticShine.getContext('2d');
        
        const shine = ctx.createLinearGradient(0, 0, W * 3, H);
        shine.addColorStop(0, 'rgba(88, 255, 214, 0)');
        shine.addColorStop(0.45, 'rgba(88, 255, 214, 0)');
        shine.addColorStop(0.5, 'rgba(88, 255, 214, 0.03)'); // subtle cyan shine
        shine.addColorStop(0.55, 'rgba(88, 255, 214, 0)');
        shine.addColorStop(1, 'rgba(88, 255, 214, 0)');

        ctx.fillStyle = shine;
        ctx.fillRect(0, 0, W * 3, H);
    }

    static renderStaticPanel(ctx) {
        ctx.save();
        
        // Remove the giant bordered rectangle.
        // Instead, we create a layered, organic layout structure.

        // 1. Right Side Content Panel (Soft fading gradient instead of hard box)
        const rightGradient = ctx.createLinearGradient(RIGHT_X - 50, 0, W, 0);
        rightGradient.addColorStop(0, 'rgba(10, 15, 25, 0)');
        rightGradient.addColorStop(0.2, 'rgba(10, 15, 25, 0.3)');
        rightGradient.addColorStop(1, 'rgba(10, 15, 25, 0.5)');
        
        ctx.fillStyle = rightGradient;
        ctx.fillRect(RIGHT_X - 100, 0, W - RIGHT_X + 100, H);

        // 2. Character Spotlight (Left Side)
        const charGlow = ctx.createRadialGradient(PX + LEFT_W / 2, H / 2, 0, PX + LEFT_W / 2, H / 2, LEFT_W);
        charGlow.addColorStop(0, 'rgba(77, 163, 255, 0.15)');
        charGlow.addColorStop(1, 'rgba(77, 163, 255, 0)');
        ctx.fillStyle = charGlow;
        ctx.fillRect(0, 0, W, H);

        // 3. Subtle structural lines for alignment (cinematic UI feel)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Top alignment line
        ctx.moveTo(PX, PY);
        ctx.lineTo(W - PX, PY);
        // Bottom alignment line
        ctx.moveTo(PX, H - PY);
        ctx.lineTo(W - PX, H - PY);
        ctx.stroke();

        ctx.restore();
    }

    static renderDynamicShine(ctx, animationController) {
        if (!staticShine) this.initShine();
        
        // Diagonal ambient light sweep across the entire layout
        const pOffset = animationController.scan(1, 0.5); // Sweeps across from 0 to 1
        
        // Slide the pre-rendered shine canvas across
        const shiftX = (pOffset * W * 1.5) - (W * 1.5);
        
        ctx.drawImage(staticShine, shiftX, 0);
    }
}

module.exports = GlassRenderer;
