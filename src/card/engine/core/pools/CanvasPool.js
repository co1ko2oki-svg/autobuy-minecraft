const { createCanvas } = require('canvas');

class CanvasPool {
    constructor(width, height, initialSize = 0) {
        this.width = width;
        this.height = height;
        this.pool = [];
        this.inUse = new Set();
        
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(createCanvas(this.width, this.height));
        }
    }

    acquire() {
        let canvas;
        if (this.pool.length > 0) {
            canvas = this.pool.pop();
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, this.width, this.height);
            // Reset transforms and state
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            ctx.shadowColor = 'rgba(0, 0, 0, 0)';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        } else {
            canvas = createCanvas(this.width, this.height);
        }
        this.inUse.add(canvas);
        return canvas;
    }

    release(canvas) {
        if (this.inUse.has(canvas)) {
            this.inUse.delete(canvas);
            this.pool.push(canvas);
        }
    }

    releaseAll() {
        for (const canvas of this.inUse) {
            this.pool.push(canvas);
        }
        this.inUse.clear();
    }
}

module.exports = CanvasPool;
