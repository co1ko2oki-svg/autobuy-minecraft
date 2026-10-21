class AnimationController {
    constructor(t) {
        this.t = t;
    }

    // --- Periodic Helpers ---

    pulse(frequency = 1, phase = 0) {
        return (Math.sin(this.t * Math.PI * 2 * frequency + phase) + 1) / 2;
    }

    wave(frequency = 1, phase = 0) {
        return Math.sin(this.t * Math.PI * 2 * frequency + phase);
    }

    scan(max, speed = 1) {
        return (this.t * max * speed) % max;
    }

    orbit(radius, frequency = 1, phase = 0) {
        const angle = this.t * Math.PI * 2 * frequency + phase;
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
        };
    }

    // --- Specific Animation Channels ---

    bodyYaw(maxDegrees = 35) {
        // Continuous, ultra-smooth floating point rotation (-35.0 to 35.0)
        // We use sine waves combined to create a natural looking-around motion
        const turn1 = Math.sin(this.t * Math.PI * 2);
        const turn2 = Math.sin(this.t * Math.PI * 4) * 0.3; 
        let turn = turn1 + turn2;
        turn = Math.sign(turn) * Math.pow(Math.abs(turn), 0.7);
        return turn * maxDegrees;
    }

    cameraPan(maxX = 10, maxY = 5) {
        // Subtle real-time camera panning/orbiting
        return {
            x: Math.sin(this.t * Math.PI * 2) * maxX,
            y: Math.cos(this.t * Math.PI * 2) * maxY
        };
    }

    shoulderSway(maxAngle = 2) {
        // Continuous shoulder rolling for life-like breath/sway
        return Math.sin(this.t * Math.PI * 2 * 2) * maxAngle;
    }

    idleFloat(amplitude = 6) {
        // Continuous floating
        return this.wave(1.5) * amplitude;
    }

    idleBreath(amplitude = 2) {
        // Continuous breathing
        return this.wave(2) * amplitude;
    }

    cameraZoom(minScale = 0.98, maxScale = 1.02) {
        // Seamless zoom in and out
        const factor = this.pulse(1, -Math.PI/2); 
        return minScale + (maxScale - minScale) * factor;
    }

    headTurn(maxAngle = 10) {
        // Independent head looking around
        return this.wave(1, Math.PI/4) * maxAngle;
    }

    headTilt(maxAngle = 4) {
        // Independent head tilt
        return this.wave(2, Math.PI / 4) * maxAngle;
    }

    bodyLean(maxAngle = 3) {
        // Independent body leaning
        return this.wave(1, Math.PI / 2) * maxAngle;
    }

    shadowScale(floatOffset, maxFloat = 6) {
        // floatOffset naturally goes between -maxFloat and +maxFloat
        const normalized = (floatOffset + maxFloat) / (maxFloat * 2); 
        // when floatOffset is highest (closest to platform), shadow is biggest
        return 1.1 - normalized * 0.3;
    }

    platformPulse() {
        return {
            opacity: 0.3 + 0.4 * this.pulse(2),
            radiusMod: this.pulse(2) * 15
        };
    }
}

module.exports = AnimationController;
