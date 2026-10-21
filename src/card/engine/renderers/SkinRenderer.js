const { PX, LEFT_W, PY, PH } = require('../config/constants');
const LightingRenderer = require('./LightingRenderer');
const { createCanvas } = require('canvas');

let staticOrbCanvas = null;

class SkinRenderer {
    static initCaches() {
        if (staticOrbCanvas) return;
        staticOrbCanvas = createCanvas(32, 32);
        const ctx = staticOrbCanvas.getContext('2d');
        const r = 16;
        const orbGlow = ctx.createRadialGradient(r, r, 0, r, r, r);
        orbGlow.addColorStop(0, `rgba(88, 255, 214, 0.4)`);
        orbGlow.addColorStop(1, 'rgba(88, 255, 214, 0)');
        ctx.fillStyle = orbGlow;
        ctx.beginPath();
        ctx.arc(r, r, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 255, 255, 1)`;
        ctx.beginPath();
        ctx.arc(r, r, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    static render(ctx, skins, animationController) {
        if (!skins || skins.length === 0) return;
        if (!staticOrbCanvas) this.initCaches();

        const skinCX = PX + LEFT_W / 2;
        const skinCY = PY + PH / 2 - 20;
        const skinH = 360;
        const skinW = skinH * 0.5;
        const baseY = skinCY + skinH / 2 - 30; // Feet position

        // 1. Draw glowing platform beneath feet
        LightingRenderer.renderPlatformGlow(ctx, skinCX, baseY + 15, 120, animationController);

        // 2. Continuous 3D frame selection
        const frameIndex = Math.floor(animationController.t * skins.length) % skins.length;
        const skinImg = skins[frameIndex];

        if (skinImg) {
            ctx.save();
            const floatY = animationController.idleFloat(6);
            const shadowSc = animationController.shadowScale(floatY, 6);
            const trueBaseY = baseY - floatY; 

            // --- Draw Continuous Dynamic Shadow (once) ---
            ctx.save();
            const shadowX = skinCX;
            const shadowY = baseY + 15;
            const shadowW = skinW * 0.6 * shadowSc;
            const shadowH = skinW * 0.15 * shadowSc;
            
            ctx.fillStyle = `rgba(0,0,0,${0.6 * shadowSc})`;
            ctx.beginPath();
            ctx.ellipse(shadowX, shadowY, shadowW/2, shadowH/2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // --- Draw Reflection ---
            ctx.save();
            const refY = (baseY + 15) * 2;
            ctx.translate(skinCX, refY);
            ctx.scale(1, -1);
            ctx.translate(0, trueBaseY);
            ctx.globalAlpha = 0.08;
            ctx.drawImage(skinImg, -skinW / 2, -skinH, skinW, skinH);
            ctx.restore();

            // --- Draw True 3D Character ---
            ctx.save();
            ctx.translate(skinCX, skinCY - floatY); 
            ctx.drawImage(skinImg, -skinW / 2, -skinH / 2, skinW, skinH);
            ctx.restore(); 

            ctx.restore();
        }

        // 3. Orbs removed for cleaner look
        ctx.globalAlpha = 1.0;
    }
}

module.exports = SkinRenderer;
