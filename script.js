// Global variables
let scene, camera, renderer, controls;
let balloons = [], cake, candles = [], confettiParticles = [], fireworks = [];
let userImage = null;
let wishes = [
    "Mehak, you're the light of my life. Happy Birthday, sis! Love, Prince.",
    "May your day be as sweet as you are. Wishing you endless joy!",
    "From your annoying brother: You're the best, and I love you tons!",
    "Here's to another year of adventures. You're my favorite person!",
    "Pop the balloons, slice the cake, and let's make memories!"
];
let surpriseInterval;

// Initialize the scene
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue for party room

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Add 3D elements
    addRoom();
    addBalloons();
    addCake();
    addCandles();
    addFloatingMessages();

    // Preload Mehak's image from the provided link
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('https://postimg.cc/K46x1PXd', (texture) => {
        // Apply to cake
        cake.material.map = texture;
        cake.material.needsUpdate = true;

        // Add to floating frame
        const frameGeometry = new THREE.PlaneGeometry(2, 2);
        const frameMaterial = new THREE.MeshBasicMaterial({ map: texture });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(5, 3, 0);
        scene.add(frame);
    });

    // Music
    const audio = document.getElementById('bgMusic');
    audio.volume = 0.5;
    audio.play();
    document.getElementById('volume').addEventListener('input', (e) => {
        audio.volume = e.target.value;
    });

    // UI Interactions
    document.getElementById('happyBtn').addEventListener('click', triggerCelebration);
    document.getElementById('showWishes').addEventListener('click', () => {
        const list = document.getElementById('wishesList');
        list.innerHTML = wishes.map(w => `<p>${w}</p>`).join('');
        list.style.display = list.style.display === 'none' ? 'block' : 'none';
    });

    // Countdown
    updateCountdown();

    // Surprise pop-ups
    surpriseInterval = setInterval(() => {
        if (Math.random() > 0.7) showSurprisePopup();
    }, 10000);

    // Hide loading
    document.getElementById('loading').style.display = 'none';

    animate();
}

// Add party room (simple floor and walls)
function addRoom() {
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Add confetti particles (initially hidden)
    for (let i = 0; i < 100; i++) {
        const particle = new THREE.Mesh(new THREE.SphereGeometry(0.05), new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff }));
        particle.position.set(Math.random() * 20 - 10, Math.random() * 10, Math.random() * 20 - 10);
        particle.visible = false;
        confettiParticles.push(particle);
        scene.add(particle);
    }
}

// Add interactive balloons
function addBalloons() {
    for (let i = 0; i < 10; i++) {
        const balloonGeometry = new THREE.SphereGeometry(0.5);
        const balloonMaterial = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
        const balloon = new THREE.Mesh(balloonGeometry, balloonMaterial);
        balloon.position.set(Math.random() * 10 - 5, Math.random() * 5 + 2, Math.random() * 10 - 5);
        balloon.userData = { popped: false };
        balloon.castShadow = true;
        balloons.push(balloon);
        scene.add(balloon);

        // Click to pop
        balloon.addEventListener('click', () => {
            if (!balloon.userData.popped) {
                balloon.scale.set(0, 0, 0);
                balloon.userData.popped = true;
                playSound('pop.mp3'); // Placeholder for pop sound
                showMessage('Balloon popped! Great job!');
            }
        });
    }
}

// Add 3D cake with slice animation
function addCake() {
    const cakeGeometry = new THREE.CylinderGeometry(2, 2, 1, 32);
    const cakeMaterial = new THREE.MeshLambertMaterial({ color: 0xff69b4 });
    cake = new THREE.Mesh(cakeGeometry, cakeMaterial);
    cake.position.set(0, 0.5, 0);
    cake.castShadow = true;
    scene.add(cake);

    // Click to slice and reveal message
    cake.addEventListener('click', () => {
        cake.rotation.y += Math.PI / 4; // Slice animation
        showMessage(wishes[Math.floor(Math.random() * wishes.length)]);
    });
}

// Add candles with flickering
function addCandles() {
    for (let i = 0; i < 5; i++) {
        const candleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1);
        const candleMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const candle = new THREE.Mesh(candleGeometry, candleMaterial);
        candle.position.set(i * 0.5 - 1, 1, 0);
        scene.add(candle);

        const flame = new THREE.PointLight(0xff4500, 1, 10);
        flame.position.set(candle.position.x, candle.position.y + 0.5, candle.position.z);
        scene.add(flame);
        candles.push({ candle, flame });

        // Hover to flicker
        candle.addEventListener('pointerover', () => {
            flame.intensity = Math.random() * 2 + 1;
        });
    }
}

// Add floating messages
function addFloatingMessages() {
    wishes.forEach((wish, index) => {
        const textGeometry = new THREE.TextGeometry(wish, { font: 'helvetiker', size: 0.2, height: 0.01 });
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(Math.random() * 10 - 5, Math.random() * 5 + 3, Math.random() * 10 - 5);
        scene.add(textMesh);

        // Follow cursor gently
        document.addEventListener('mousemove', (e) => {
            textMesh.position.x += (e.clientX / window.innerWidth - 0.5) * 0.01;
            textMesh.position.z += (e.clientY / window.innerHeight - 0.5) * 0.01;
        });
    });
}

// Trigger celebration (confetti and fireworks)
function triggerCelebration() {
    confettiParticles.forEach(p => {
        p.visible = true;
        p.position.y += Math.random() * 0.1;
    });
    // Simple fireworks (particles shooting up)
    for (let i = 0; i < 20; i++) {
        const firework = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        firework.position.set(Math.random() * 10 - 5, 0, Math.random() * 10 - 5);
        scene.add(firework);
        fireworks.push(firework);
        setTimeout(() => scene.remove(firework), 2000);
    }
    playSound('firework.mp3'); // Placeholder
}

// Upload and apply image (additional feature)
function uploadImage() {
    const file = document.getElementById('imageUpload').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const texture = new THREE.TextureLoader().load(e.target.result);
            cake.material.map = texture;
            cake.material.needsUpdate = true;

            // Add to floating frame
            const frameGeometry = new THREE.PlaneGeometry(2, 2);
            const frameMaterial = new THREE.MeshBasicMaterial({ map: texture });
            const frame = new THREE.Mesh(frameGeometry, frameMaterial);
            frame.position.set(5, 3, 0);
            scene.add(frame);
        };
        reader.readAsDataURL(file);
    }
}

// Countdown timer
function updateCountdown() {
    const now = new Date();
    const birthday = new Date(now.getFullYear(), 11, 14); // Dec 14
    if (now > birthday) birthday.setFullYear(now.getFullYear() + 1);
    const diff = birthday - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    document.getElementById('timer').textContent = `${days}d ${hours}h`;
    setTimeout(updateCountdown, 1000);
}

// Surprise popup
function showSurprisePopup() {
    alert("Surprise! " + wishes[Math.floor(Math.random() * wishes.length)]);
}

// Show message
function showMessage(msg) {
    const popup = document.createElement('div');
    popup.textContent = msg;
    popup.style.position = 'absolute';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.background = 'rgba(255, 255, 255, 0.9)';
    popup.style.padding = '20px';
    popup.style.borderRadius = '10px';
    document.body.appendChild(p