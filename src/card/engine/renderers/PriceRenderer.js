const { C } = require('../config/constants');
const TextRenderer = require('./TextRenderer');
const { createCanvas } = require('canvas');

class PriceRenderer {
    static render(ctx, priceText, prX, prY, animationController) {
        const numPrice = parseInt(String(priceText).replace(/\D/g, '')) || 0;
        const finalPrice = numPrice === 0 ? "0" : numPrice.toLocaleString('vi-VN');
        const cachedPriceW = TextRenderer.measureWidth(ctx, finalPrice, 42, 'bold') + 80;
        const cachedBoxX = prX - cachedPriceW;
        const cachedBoxY = prY - 35;
        const cachedBoxH = 60;
        
        ctx.save();
        
        // Dynamic Bracket Pulse
        const glowPulse = Math.sin(animationController.t * Math.PI * 4) * 0.1 + 0.3;
        ctx.globalAlpha = glowPulse * 2; // scale up to visible opacity
        
        // Draw bracket directly
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath();
        ctx.roundRect(cachedBoxX - 10, cachedBoxY - 20, cachedPriceW + 10, cachedBoxH + 40, 14);
        ctx.fill();
        ctx.strokeStyle = 'rgba(88, 255, 214, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Static elements
        ctx.globalAlpha = 1.0;

        // Label
        ctx.font = TextRenderer.getFont(10, '900');
        ctx.fillStyle = 'rgba(88, 255, 214, 0.6)';
        ctx.textAlign = 'right';
        ctx.fillText('ACCOUNT VALUE', prX, cachedBoxY - 10);

        // Coin Icon (Base)
        const coinX = cachedBoxX + 24;
        const coinY = cachedBoxY + cachedBoxH / 2;
        
        ctx.fillStyle = C.sec;
        ctx.beginPath();
        ctx.arc(coinX, coinY, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.font = TextRenderer.getFont(10, 'bold');
        ctx.fillStyle = '#0D1117';
        ctx.textAlign = 'center';
        ctx.fillText('₫', coinX, coinY + 4);

        // Draw shadow of the price text (avoids doing shadow every frame)
        ctx.font = TextRenderer.getFont(42, 'bold');
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillText(finalPrice, prX - 16 + 4, cachedBoxY + 40 + 4);

        // Dynamic Coin Glow
        ctx.fillStyle = `rgba(88,255,214,${0.2 + 0.2 * glowPulse})`;
        ctx.beginPath();
        ctx.arc(coinX, coinY, 15, 0, Math.PI * 2);
        ctx.fill();

        // Sweeping gradient for Price Text
        const pGrad = ctx.createLinearGradient(cachedBoxX, 0, cachedBoxX + cachedPriceW, 0);
        const pOffset = animationController.scan(1, 2); 
        
        pGrad.addColorStop(0, '#FFFFFF');
        pGrad.addColorStop(Math.abs(pOffset - 0.5), '#58FFD6');
        pGrad.addColorStop(1, '#FFFFFF');

        ctx.font = TextRenderer.getFont(42, 'bold');
        ctx.textAlign = 'right';
        ctx.fillStyle = pGrad;
        ctx.fillText(finalPrice, prX - 16, cachedBoxY + 40);

        ctx.restore();
    }
}

module.exports = PriceRenderer;
