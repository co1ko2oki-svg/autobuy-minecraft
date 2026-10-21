const W = 1400, H = 700;
const SCALE = 0.5;
const OUT_W = Math.floor(W * SCALE), OUT_H = Math.floor(H * SCALE);

const PX = 48, PY = 48, PW = W - 96, PH = H - 96, PR = 20;
const LEFT_W = Math.floor(PW * 0.28);
const RIGHT_X = PX + LEFT_W + 40;
const RIGHT_W = PW - LEFT_W - 80;

const FRAMES = 36; // Reduced to prevent Discord 8MB limit error
const DELAY = 50; // 20 FPS

const C = { accent: '#4DA3FF', sec: '#58FFD6', white: '#F0F4F8', gray: '#94A3B8', dgray: '#5A6A7E' };

module.exports = {
    W, H, SCALE, OUT_W, OUT_H,
    PX, PY, PW, PH, PR,
    LEFT_W, RIGHT_X, RIGHT_W,
    FRAMES, DELAY,
    C,
    FONTS: {
        family: '"MC","Segoe UI",sans-serif'
    }
};
