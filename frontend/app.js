document.addEventListener('DOMContentLoaded', () => {
    initSkinViewer();
    initAmbientParticles();
    initMagneticButtons();
    populateCapes();
});

// --- 3D Skin Viewer ---
function initSkinViewer() {
    const canvas = document.getElementById('skin-viewer');
    const container = document.getElementById('character-container');
    
    // Create viewer
    const viewer = new skinview3d.SkinViewer({
        canvas: canvas,
        width: container.clientWidth,
        height: container.clientHeight,
        alpha: true
    });

    viewer.camera.position.set(0, 5, 45);
    viewer.camera.lookAt(0, 5, 0);

    // Cinematic Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    viewer.scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    viewer.scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x58ffd6, 0.6);
    rimLight.position.set(-15, 10, -20);
    viewer.scene.add(rimLight);

    const bottomLight = new THREE.DirectionalLight(0x4DA3FF, 0.4);
    bottomLight.position.set(0, -20, 0);
    viewer.scene.add(bottomLight);

    // Load Technoblade Skin (using Crafatar or local if needed, we'll use a generic API for now)
    // Note: mc-heads or crafatar
    viewer.loadSkin("https://crafatar.com/skins/b876ec32e396476ba1158438d83c67d4").then(() => {
        // Animation loop
        let time = 0;
        viewer.animation = {
            play: true,
            speed: 1,
            update: (viewer, delta) => {
                time += delta * 0.5; // slow time
                
                // Breathing and Floating
                const breath = Math.sin(time * 2);
                viewer.playerObject.position.y = breath * 0.2;
                viewer.playerObject.scale.y = 1.0 + breath * 0.015;

                // Subtle Rotation
                viewer.playerObject.rotation.y = Math.sin(time) * 0.3;

                // Arm/Leg idle sway
                const armSway = Math.cos(time) * 0.1;
                viewer.playerObject.skin.leftArm.rotation.x = armSway + 0.1;
                viewer.playerObject.skin.rightArm.rotation.x = -armSway + 0.1;
                viewer.playerObject.skin.leftArm.rotation.z = 0.05;
                viewer.playerObject.skin.rightArm.rotation.z = -0.05;
            }
        };
    }).catch(e => console.error("Skin load error", e));

    // Handle Resize
    window.addEventListener('resize', () => {
        viewer.width = container.clientWidth;
        viewer.height = container.clientHeight;
    });
}

// --- Cape Gallery ---
function populateCapes() {
    const capes = [
        "15th Anniversary", "Builder", "Cherry Blossom", "Common", 
        "Copper", "Follower's", "Founder's", "Home", 
        "MCC 15th Year", "Menace", "Migrator", "Minecraft Experience", 
        "Mojang Office", "Pan", "Purple Heart", "Vanilla", "Yearn", "Zombie Horse"
    ];
    
    const gallery = document.getElementById('cape-gallery');
    
    capes.forEach((cape, index) => {
        const item = document.createElement('div');
        item.className = 'cape-item';
        item.style.animationDelay = `${index * 0.05}s`;
        
        // Load the cape image locally
        item.innerHTML = `
            <img src="./assets/cape/${cape}.png" alt="${cape}" onerror="this.src='https://via.placeholder.com/48x72/1a1a1a/58ffd6?text=Cape'">
            <span class="cape-name">${cape}</span>
        `;
        gallery.appendChild(item);
    });
}

// --- Magnetic Buttons ---
function initMagneticButtons() {
    const magneticElements = document.querySelectorAll('[data-magnetic]');
    
    magneticElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const h = rect.width / 2;
            const v = rect.height / 2;
            
            const x = e.clientX - rect.left - h;
            const y = e.clientY - rect.top - v;
            
            // Move button
            el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
            
            // Move background glow slightly faster for parallax
            const bg = el.querySelector('.btn-bg');
            if(bg) bg.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });
        
        el.addEventListener('mouseleave', () => {
            el.style.transform = 'translate(0, 0)';
            const bg = el.querySelector('.btn-bg');
            if(bg) bg.style.transform = 'translate(0, 0)';
        });
    });
}

// --- Ambient Particle System ---
function initAmbientParticles() {
    const canvas = document.getElementById('ambient-canvas');
    const ctx = canvas.getContext('2d');
    
    let w, h;
    const particles = [];
    
    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();
    
    class Particle {
        constructor() {
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.size = Math.random() * 2 + 0.5;
            this.speedY = Math.random() * -0.5 - 0.1;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.opacity = Math.random() * 0.5 + 0.1;
            // Teal / Blue mixed
            this.color = Math.random() > 0.5 ? 'rgba(88, 255, 214, ' : 'rgba(77, 163, 255, ';
        }
        update() {
            this.y += this.speedY;
            this.x += this.speedX;
            
            if (this.y < -10) this.y = h + 10;
            if (this.x < -10) this.x = w + 10;
            if (this.x > w + 10) this.x = -10;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color + this.opacity + ')';
            ctx.fill();
        }
    }
    
    for (let i = 0; i < 70; i++) {
        particles.push(new Particle());
    }
    
    function animate() {
        ctx.clearRect(0, 0, w, h);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }
    
    animate();
}
