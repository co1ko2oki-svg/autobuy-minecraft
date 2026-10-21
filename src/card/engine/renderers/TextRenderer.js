const { FONTS } = require('../config/constants');

const fontCache = new Map();
const widthCache = new Map();
const { createCanvas } = require('canvas');
const dummyCtx = createCanvas(1, 1).getContext('2d');

class TextRenderer {
    static getFont(size, weight = 'normal') {
        const key = `${size}_${weight}`;
        if (fontCache.has(key)) return fontCache.get(key);
        
        let f;
        if (weight === 'bold') f = `bold ${size}px ${FONTS.family}`;
        else if (weight === '500') f = `500 ${size}px ${FONTS.family}`;
        else f = `${weight} ${size}px ${FONTS.family}`;
        
        fontCache.set(key, f);
        return f;
    }

    /**
     * Draw text with a deep shadow behind it
     */
    static drawShadowedText(ctx, text, x, y, size, color, align = 'left', weight = 'normal') {
        ctx.font = this.getFont(size, weight);
        ctx.textAlign = align;
        
        // Deep shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillText(text, x + 1, y + 1);
        
        // Actual text
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        
        // Reset alignment
        ctx.textAlign = 'left';
    }

    /**
     * Draw text with a linear gradient filling
     */
    static drawGradientText(ctx, text, x, y, size, gradient, shadowOffset = 3, align = 'left', weight = 'bold') {
        ctx.font = this.getFont(size, weight);
        ctx.textAlign = align;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillText(text, x + shadowOffset, y + shadowOffset);
        
        // Gradient
        ctx.fillStyle = gradient;
        ctx.fillText(text, x, y);
        
        // Reset alignment
        ctx.textAlign = 'left';
    }
    
    /**
     * Get exact width of text for dynamic layouts
     */
    static measureWidth(ctx, text, size, weight = 'normal') {
        const font = this.getFont(size, weight);
        const key = `${text}_${font}`;
        if (widthCache.has(key)) return widthCache.get(key);
        
        const mCtx = ctx || dummyCtx;
        mCtx.font = font;
        const w = mCtx.measureText(text).width;
        widthCache.set(key, w);
        return w;
    }
}

module.exports = TextRenderer;
