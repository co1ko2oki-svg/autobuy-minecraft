const { parentPort } = require('worker_threads');
const GIFEncoder = require('gif-encoder-2');

let encoder = null;

parentPort.on('message', async (msg) => {
    try {
        if (msg.type === 'init') {
            const { width, height, delay, quality } = msg;
            encoder = new GIFEncoder(width, height, 'neuquant', true, 100);
            encoder.start();
            encoder.setRepeat(0);
            encoder.setDelay(delay);
            encoder.setQuality(quality);
            parentPort.postMessage({ type: 'ready' });
        } else if (msg.type === 'frame') {
            const { pixels, width, height } = msg;
            const mockCtx = {
                getImageData: () => ({ data: pixels, width, height })
            };
            encoder.addFrame(mockCtx);
            parentPort.postMessage({ type: 'frameDone' });
        } else if (msg.type === 'finish') {
            encoder.finish();
            const buffer = encoder.out.getData();
            parentPort.postMessage({ type: 'done', buffer }, [buffer.buffer]);
        }
    } catch (e) {
        parentPort.postMessage({ type: 'error', error: e.message });
    }
});
