const puppeteer = require('puppeteer');
const { createCanvas, loadImage } = require('canvas');
const Logger = require('./Logger');
const { FRAMES } = require('../config/constants');

class WebGlRenderer {
    static async render3DSkin(username) {
        Logger.log(`[WebGL] Launching headless browser for ${username}...`);
        
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // We will render exactly the size we need to avoid resizing later
        const renderW = 400; 
        const renderH = 600;
        await page.setViewport({ width: renderW, height: renderH, deviceScaleFactor: 1 });

        // Build the HTML template
        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <style>
                body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
                canvas { display: block; }
            </style>
        </head>
        <body>
            <canvas id="skin_container"></canvas>

            <script src="https://unpkg.com/three@0.149.0/build/three.js"></script>
            <script src="https://unpkg.com/skinview3d@3.4.2/bundles/skinview3d.bundle.js"></script>

            <script>
                window.skinFrames = [];
                window.renderComplete = false;

                async function renderFrames() {
                    console.log("Initializing viewer");
                    const canvas = document.getElementById("skin_container");
                    const viewer = new skinview3d.SkinViewer({
                        canvas: canvas,
                        width: ${renderW},
                        height: ${renderH},
                        alpha: true
                    });

                    // Set camera angle to roughly match Visage isometric view
                    viewer.camera.position.set(0, 5, 40);
                    viewer.camera.lookAt(0, 5, 0);

                    // Add nice cinematic lighting
                    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
                    viewer.scene.add(ambientLight);
                    
                    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
                    dirLight.position.set(10, 20, 10);
                    viewer.scene.add(dirLight);

                    const rimLight = new THREE.DirectionalLight(0x58ffd6, 0.5);
                    rimLight.position.set(-10, 10, -20);
                    viewer.scene.add(rimLight);

                    console.log("Loading skin...");
                    // Wait for the skin to load
                    await viewer.loadSkin("https://mc-heads.net/skin/${username}");
                    console.log("Skin loaded successfully!");

                    // Stop the automatic render loop because we want exact frames
                    viewer.animation = null; 
                    
                    const numFrames = ${FRAMES};
                    
                    for (let i = 0; i < numFrames; i++) {
                        const t = i / numFrames;
                        
                        // --- MATHEMATICAL AAA PHYSICS ---
                        
                        // 1. Body Yaw (subtle panning left and right)
                        const turn1 = Math.sin(t * Math.PI * 2);
                        const turn2 = Math.sin(t * Math.PI * 4) * 0.3; 
                        let turn = turn1 + turn2;
                        turn = Math.sign(turn) * Math.pow(Math.abs(turn), 0.7);
                        const maxDegrees = 25;
                        viewer.playerObject.rotation.y = turn * maxDegrees * (Math.PI / 180);

                        // 2. Breathing (Chest scaling + subtle Y translation)
                        const breath = Math.sin(t * Math.PI * 2 * 2); // 2 cycles per loop
                        viewer.playerObject.position.y = breath * 0.2;
                        viewer.playerObject.scale.y = 1.0 + breath * 0.02;

                        // 3. Independent Head Movement
                        const headPan = Math.sin(t * Math.PI * 2) * 15; // looks around
                        const headTilt = Math.cos(t * Math.PI * 2 * 2) * 5; // tilts slightly
                        viewer.playerObject.skin.head.rotation.y = headPan * (Math.PI / 180);
                        viewer.playerObject.skin.head.rotation.z = headTilt * (Math.PI / 180);

                        // 4. Arm Swaying (Subtle inertia)
                        const armSway = Math.cos(t * Math.PI * 2) * 10;
                        viewer.playerObject.skin.leftArm.rotation.x = (armSway + 10) * (Math.PI / 180);
                        viewer.playerObject.skin.rightArm.rotation.x = (-armSway + 10) * (Math.PI / 180);
                        viewer.playerObject.skin.leftArm.rotation.z = 5 * (Math.PI / 180); // Outward
                        viewer.playerObject.skin.rightArm.rotation.z = -5 * (Math.PI / 180); // Outward

                        // 5. Leg Shift (Subtle weight shifting)
                        const legShift = Math.sin(t * Math.PI * 2 * 2) * 2;
                        viewer.playerObject.skin.leftLeg.rotation.x = legShift * (Math.PI / 180);
                        viewer.playerObject.skin.rightLeg.rotation.x = -legShift * (Math.PI / 180);

                        // Render scene
                        viewer.renderer.render(viewer.scene, viewer.camera);

                        // Extract Data URL
                        window.skinFrames.push(canvas.toDataURL("image/png"));
                    }

                    window.renderComplete = true;
                }
                
                renderFrames().catch(e => {
                    console.error(e);
                    window.renderComplete = true; // prevent hang
                });
            </script>
        </body>
        </html>
        `;

        page.on('console', msg => Logger.log(`[Browser] ${msg.type()}: ${msg.text()}`));
        page.on('pageerror', err => Logger.error(`[Browser Error]`, err));

        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Wait until renderComplete is true
        await page.waitForFunction('window.renderComplete === true', { timeout: 60000 });

        // Retrieve the 80 base64 images
        const framesBase64 = await page.evaluate(() => window.skinFrames);

        await browser.close();

        Logger.log(`[WebGL] Captured ${framesBase64.length} hardware-accelerated frames.`);

        // Convert base64 strings to node canvas images
        const images = [];
        for (let i = 0; i < framesBase64.length; i++) {
            const img = await loadImage(framesBase64[i]);
            images.push(img);
        }

        return images;
    }
}

module.exports = WebGlRenderer;
