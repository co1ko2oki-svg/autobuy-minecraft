const { createCanvas } = require('canvas');
const { PX, PY, PW, PH, LEFT_W } = require('../config/constants');
const CanvasPool = require('../core/pools/CanvasPool');

const particlePool = new CanvasPool(32, 32, 3);
const cachedHalos = [];
const numParticles = 0;

// Typed arrays for procedural values to avoid repeated math
const pSeeds = new Float32Array(numParticles);
const pOrbitRadii = new Float32Array(numParticles);
const pOrbitSpeeds = new Float32Array(numParticles);
const pDriftLoops = new Float32Array(numParticles);
const pTypes = new Uint8Array(numParticles);
const pBaseX = new Float32Array(numParticles);
const pBaseY = new Float32Array(numParticles);

// Pre-initialize math
for (let p = 0; p < numParticles; p++) {
    const seed = p * 137.508;
    pSeeds[p] = seed;
    pOrbitRadii[p] = 100 + (seed % 300);
    pOrbitSpeeds[p] = Math.floor(1 + (seed % 3));
    pDriftLoops[p] = Math.floor(1 + (seed % 2));
    pTypes[p] = p % 3;
    pBaseX[p] = (p % 2 === 0 ? 400 : 0);
    pBaseY[p] = PY + PH + (seed % PH);
}

class ParticleRenderer {
    static initHalos() {
        if (cachedHalos.length > 0) return;
        
        const colors = [
            { r: 88, g: 255, b: 214 }, // Teal
            { r: 77, g: 163, b: 255 }, // Blue
            { r: 255, g: 255, b: 255 }  // White
        ];

        for (let i = 0; i < 3; i++) {
            const canvas = particlePool.acquire();
            const ctx = canvas.getContext('2d');
            const r = colors[i].r;
            const g = colors[i].g;
            const b = colors[i].b;

            // Draw maximum size halo (radius 16, diameter 32)
            const halo = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
            halo.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.5)`);
            halo.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(16, 16, 16, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`;
            ctx.beginPath();
            ctx.arc(16, 16, 2, 0, Math.PI * 2);
            ctx.fill();
            
            cachedHalos.push(canvas);
        }
    }

    static renderAtmosphere(ctx, animationController) {
        if (cachedHalos.length === 0) this.initHalos();

        const skinCX = PX + LEFT_W / 2;
        const t = animationController.t;
        const pi2 = Math.PI * 2;
        
        // Fast batch rendering
        for (let p = 0; p < numParticles; p++) {
            const seed = pSeeds[p];
            const pType = pTypes[p];
            
            const radiusMod = pOrbitRadii[p] + Math.sin(t * pi2 + p) * 30;
            const pos = animationController.orbit(radiusMod, pOrbitSpeeds[p], seed * pi2);
            
            const px = skinCX - 100 + (pos.x * 1.5) + pBaseX[p];
            
            const driftY = (t * pDriftLoops[p] * PH) % PH;
            let py = pBaseY[p] - driftY;
            if (py < PY) py += PH;

            const twinkle = Math.sin(t * pi2 * 4 + p * 2.5);
            let pa = 0.1 + 0.5 * Math.max(0, twinkle);
            
            if (py < PY + 60) pa *= Math.max(0, (py - PY) / 60);
            if (py > PY + PH - 60) pa *= Math.max(0, (PY + PH - py) / 60);

            if (pa > 0.05) {
                const scale = (0.6 + (seed % 0.8)) * (1 + 1.5 * Math.max(0, twinkle));
                const drawSize = 32 * scale;
                const halfSize = drawSize / 2;

                ctx.globalAlpha = pa;
                // Avoid expensive shadow calls, just draw the cached halo image
                ctx.drawImage(cachedHalos[pType], px - halfSize, py - halfSize, drawSize, drawSize);
            }
        }
        ctx.globalAlpha = 1.0;
    }
}

module.exports = ParticleRenderer;
