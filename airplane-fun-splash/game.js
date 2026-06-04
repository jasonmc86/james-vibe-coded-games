// Jason and James's Airplane Fun Splash

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// World
const W = canvas.width;
const H = canvas.height;
const GROUND_Y = H - 90;
const RUNWAY_Y = H - 70;
const RUNWAY_H = 60;

// Plane
const PLANE_W = 64;
const PLANE_H = 36;
let planeY = 120;
const SKY_PLANE_Y = 120;
const RUNWAY_PLANE_Y = RUNWAY_Y - 26;
const PLANE_SPEED = 6.5;
const PLANE_EASE = 0.15; // smoothing for straighter feel

// Water drops
const DROP_R = 8;
const DROP_SPEED = 8;
const START_WATER = 5;

// Fires
const FIRE_W = 30;
const FIRE_H = 36;
const FIRE_SPAWN_MS = 1300;
const FIRE_UPDOWN_MS = 900;
const WIN_SCORE = 15;

let planeX = W / 2 - PLANE_W / 2;
let leftPressed = false;
let rightPressed = false;
let drops = [];
let fires = [];
let runwayFire = null;
let cloudFire = null;
let lastFireSpawn = 0;
let score = 0;
let water = START_WATER;
let gameOver = false;
let gameWon = false;
let overlay = document.getElementById('overlay');
let result = document.getElementById('result');
const hud = document.getElementById('hud');

let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let tiltX = 0;
let targetX = planeX;
let onRunway = false;
const runwayBtn = document.getElementById('runway-btn');
let lastSpaceAt = 0;
let sentCars = 0;

function updateHUD() {
    hud.textContent = `Score: ${score} | Water: ${water}`;
    document.getElementById('progress-inner').style.width = `${(score / WIN_SCORE) * 100}%`;
}

function drawBackground() {
    // Sky
    ctx.fillStyle = '#7ec8ff';
    ctx.fillRect(0, 0, W, H);
    // Sun
    ctx.save();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(80, 80, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Two moons (daytime fun!)
    ctx.save();
    ctx.fillStyle = '#f1f2f6';
    ctx.beginPath(); ctx.arc(160, 60, 14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(200, 90, 12, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // Ground
    ctx.fillStyle = '#6ab04c';
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    // Runway
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(0, RUNWAY_Y, W, RUNWAY_H);
    // Runway centerlines
    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 4;
    ctx.setLineDash([18, 18]);
    ctx.beginPath();
    ctx.moveTo(0, RUNWAY_Y + RUNWAY_H / 2);
    ctx.lineTo(W, RUNWAY_Y + RUNWAY_H / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // Simple buildings
    ctx.fillStyle = '#95a5a6';
    for (let i = 0; i < 6; i++) {
        const bx = 40 + i * 120;
        const bh = 40 + (i % 3) * 18;
        ctx.fillRect(bx, GROUND_Y - bh, 50, bh);
        ctx.fillStyle = '#bdc3c7';
        ctx.fillRect(bx + 8, GROUND_Y - bh + 10, 10, 10);
        ctx.fillRect(bx + 28, GROUND_Y - bh + 10, 10, 10);
        ctx.fillStyle = '#95a5a6';
    }
    // Trees
    for (let i = 0; i < 8; i++) {
        const tx = 20 + i * 100 + ((i % 2) * 20);
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(tx, GROUND_Y - 20, 10, 20);
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.arc(tx + 5, GROUND_Y - 26, 14, 0, Math.PI * 2);
        ctx.fill();
    }
    // Airport cars (tugs) always left-to-right
    ctx.font = '28px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const t = performance.now() / 600;
    const carX1 = (t * 140) % (W + 120) - 60;
    const carX2 = ((t + 2) * 140) % (W + 120) - 60;
    ctx.fillText('🚗', carX1, RUNWAY_Y + RUNWAY_H - 18);
    ctx.fillText('🚚', carX2, RUNWAY_Y + RUNWAY_H - 18);
    // Car park area with 10 sections
    const parkY = RUNWAY_Y + RUNWAY_H + 4;
    const parkH = Math.max(0, H - parkY);
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(0, parkY, W, parkH);
    // Outline and big sign pointing to car parks
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, parkY + 1, W - 2, parkH - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(W / 2 - 130, RUNWAY_Y + RUNWAY_H - 30, 260, 26);
    ctx.fillStyle = '#2c3e50';
    ctx.font = '22px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('CAR PARKS ↓', W / 2, RUNWAY_Y + RUNWAY_H - 17);
    ctx.fillStyle = '#2c3e50';
    ctx.font = '20px Arial';
    const sections = 10;
    const sectionW = W / sections;
    for (let s = 0; s < sections; s++) {
        const sx = s * sectionW;
        // divider lines
        ctx.fillStyle = '#ffffff33';
        ctx.fillRect(sx, parkY, 2, parkH);
        // label
        ctx.fillStyle = '#2c3e50';
        ctx.fillText(`CAR PARK ${s + 1}`, sx + sectionW / 2, parkY + 22);
        // cars inside section
        ctx.font = '24px Arial';
        const cars = ['🚗','🚙','🚕','🚓','🚐','🚘'];
        for (let i = 0; i < 6; i++) {
            const px = sx + 20 + i * ((sectionW - 40) / 6);
            const py = parkY + 52 + (i % 2) * 34;
            ctx.fillText(cars[i % cars.length], px, py);
        }
        ctx.font = '20px Arial';
    }
    // Arriving cars that were sent into the car park by pressing J
    ctx.font = '24px Arial';
    const perRow = 20;
    for (let i = 0; i < sentCars; i++) {
        const row = Math.floor(i / perRow);
        const col = i % perRow;
        const px = 20 + col * ((W - 40) / perRow);
        const py = parkY + 120 + row * 28;
        const icon = ['🚗','🚙','🚕','🚓','🚐','🚘'][i % 6];
        ctx.fillText(icon, px, py);
    }
    // Many people near the car park
    ctx.font = '28px Arial';
    for (let i = 0; i < 8; i++) {
        ctx.fillText('👤', 40 + i * 40, parkY + 42 + (i % 2) * 8);
    }
    ctx.font = '56px Arial';
    ctx.fillText('🐄', 100, parkY + 44);
    // Control tower next to runway
    const towerX = W - 90;
    const towerBaseY = RUNWAY_Y - 10;
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(towerX, towerBaseY - 140, 24, 140);
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(towerX - 10, towerBaseY - 160, 44, 24);
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(towerX - 6, towerBaseY - 154, 36, 12);
    // Clouds (some may catch fire)
    ctx.font = '32px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < 6; i++) {
        const cx = (i * 140 + (performance.now() / 50) % 140) % (W + 140) - 70;
        const cy = 60 + (i % 2) * 20;
        ctx.fillText('☁️', cx, cy);
    }
}

function drawPlane() {
    ctx.save();
    ctx.font = '40px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('✈️', planeX + PLANE_W / 2, planeY + PLANE_H / 2);
    // Label player's plane "JAMES"
    ctx.fillStyle = '#2c3e50';
    ctx.font = '14px Arial';
    ctx.fillText('JAMES', planeX + PLANE_W / 2, planeY - 10);
    ctx.restore();
}

function drawParkedPlanes() {
    // parked planes near runway apron
    ctx.save();
    ctx.font = '36px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const count = 9; // previously 4, now five more
    for (let i = 0; i < count; i++) {
        const px = 80 + i * ((W - 160) / (count - 1));
        const py = RUNWAY_Y - 40 - (i % 2) * 10;
        ctx.fillText('✈️', px, py);
    }
    ctx.restore();
}

function spawnRunwayFire() {
    // Only sometimes create a single runway fire, and not too frequently
    const now = Date.now();
    if (runwayFire || now - lastFireSpawn < FIRE_SPAWN_MS * 2.2) return;
    if (Math.random() < 0.3) {
        runwayFire = {
            x: Math.random() * (W - FIRE_W - 80) + 40,
            y: RUNWAY_Y - 8,
            t0: now
        };
        lastFireSpawn = now;
    }
}

function spawnCloudFire() {
    // Rare cloud fire high in the sky
    if (cloudFire) return;
    if (Math.random() < 0.0025) {
        const now = Date.now();
        cloudFire = {
            x: Math.random() * (W - 100) + 50,
            y: 70 + Math.random() * 40,
            t0: now
        };
    }
}

function drawFires() {
    ctx.save();
    ctx.font = '32px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (runwayFire) {
        const f = runwayFire;
        const phase = ((Date.now() - f.t0) % FIRE_UPDOWN_MS) / FIRE_UPDOWN_MS;
        const bob = Math.sin(phase * Math.PI * 2) * 4;
        ctx.fillText('🔥', f.x + FIRE_W / 2, RUNWAY_Y + RUNWAY_H / 2 - 8 + bob);
    }
    if (cloudFire) {
        const f = cloudFire;
        ctx.fillText('🔥', f.x, f.y);
    }
    ctx.restore();
}

function dropWater() {
    if (gameOver) return;
    if (water <= 0) return;
    water--;
    drops.push({ x: planeX + PLANE_W / 2, y: planeY + PLANE_H / 2, r: DROP_R });
    updateHUD();
}

function drawDrops() {
    ctx.save();
    ctx.font = '24px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const d of drops) {
        ctx.fillText('💧', d.x, d.y);
    }
    ctx.restore();
}

function updateDrops() {
    for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.y += DROP_SPEED;
        if (d.y > H + 20) {
            drops.splice(i, 1);
        }
    }
}

function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function checkHits() {
    for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        const dRect = { x: d.x - 8, y: d.y - 8, w: 16, h: 16 };
        if (runwayFire) {
            const fRect = { x: runwayFire.x, y: RUNWAY_Y, w: FIRE_W, h: RUNWAY_H };
            if (rectsOverlap(dRect, fRect)) {
                drops.splice(i, 1);
                runwayFire = null;
                score++;
                if (score % 3 === 0) water = Math.min(START_WATER, water + 1);
                updateHUD();
                if (score >= WIN_SCORE) win();
                continue;
            }
        }
        if (cloudFire) {
            const fRect = { x: cloudFire.x - 12, y: cloudFire.y - 12, w: 24, h: 24 };
            if (rectsOverlap(dRect, fRect)) {
                drops.splice(i, 1);
                cloudFire = null;
                score++;
                if (score % 3 === 0) water = Math.min(START_WATER, water + 1);
                updateHUD();
                if (score >= WIN_SCORE) win();
                continue;
            }
        }
    }
}

function updatePlane() {
    const deadzone = 2.2;
    if (isMobile) {
        if (tiltX < -deadzone) targetX -= PLANE_SPEED;
        else if (tiltX > deadzone) targetX += PLANE_SPEED;
    } else {
        if (leftPressed) targetX -= PLANE_SPEED;
        if (rightPressed) targetX += PLANE_SPEED;
    }
    targetX = Math.max(0, Math.min(W - PLANE_W, targetX));
    planeX += (targetX - planeX) * PLANE_EASE;
    // Glide altitude toward runway or sky level
    const targetY = onRunway ? RUNWAY_PLANE_Y : SKY_PLANE_Y;
    planeY += (targetY - planeY) * 0.12;
}

function gameLoop() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    spawnRunwayFire();
    spawnCloudFire();
    updateDrops();
    checkHits();
    updatePlane();
    drawPlane();
    drawParkedPlanes();
    drawFires();
    drawDrops();
    requestAnimationFrame(gameLoop);
}

function lose() {
    gameOver = true;
    gameWon = false;
    overlay.style.display = 'flex';
    result.textContent = `Out of water! Score: ${score}/${WIN_SCORE}`;
}

function win() {
    gameOver = true;
    gameWon = true;
    overlay.style.display = 'flex';
    result.textContent = `🎉 You win! Score: ${score}/${WIN_SCORE}`;
}

function restart() {
    planeX = W / 2 - PLANE_W / 2;
    targetX = planeX;
    planeY = SKY_PLANE_Y;
    onRunway = false;
    leftPressed = false; rightPressed = false;
    drops = [];
    fires = [];
    runwayFire = null;
    cloudFire = null;
    lastFireSpawn = 0;
    score = 0;
    water = START_WATER;
    gameOver = false;
    gameWon = false;
    overlay.style.display = 'none';
    updateHUD();
}

document.getElementById('restart-btn').addEventListener('click', () => {
    restart();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        restart();
        return;
    }
    // Key "6" refills water politely when empty
    if (e.key === '6') {
        if (water <= 0) {
            water = START_WATER;
            updateHUD();
        }
        return;
    }
    if (e.key === 'j' || e.key === 'J') {
        sentCars++;
    }
    if (gameOver) return;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') leftPressed = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') rightPressed = true;
    if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        const now = performance.now();
        const isDoubleTap = now - lastSpaceAt < 450;
        lastSpaceAt = now;
        if (isDoubleTap) {
            water = START_WATER;
            updateHUD();
            return;
        }
        // Auto behavior: if runway fire exists, move toward it, land, and drop water
        if (runwayFire) {
            onRunway = true;
            // steer toward fire
            targetX = runwayFire.x - PLANE_W / 2;
            // if near horizontally and low enough, drop water
            if (Math.abs((planeX + PLANE_W / 2) - (runwayFire.x + FIRE_W / 2)) < 30 && Math.abs(planeY - RUNWAY_PLANE_Y) < 10) {
                dropWater();
            }
        } else if (cloudFire) {
            onRunway = false; // go skyward
            targetX = cloudFire.x - PLANE_W / 2;
            if (Math.abs((planeX + PLANE_W / 2) - cloudFire.x) < 28 && Math.abs(planeY - SKY_PLANE_Y) < 14) {
                dropWater();
            }
        } else {
            dropWater();
        }
        if (water <= 0 && drops.length === 0) lose();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') leftPressed = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') rightPressed = false;
});

// Mobile input
if (isMobile) {
    window.addEventListener('deviceorientation', (e) => {
        if (typeof e.gamma === 'number') {
            tiltX = e.gamma;
        }
    });
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        dropWater();
        if (water <= 0 && drops.length === 0) lose();
    }, { passive: false });
}

// Runway button toggles landing/takeoff
runwayBtn.addEventListener('click', () => {
    onRunway = !onRunway;
    runwayBtn.textContent = onRunway ? 'TAKE OFF (back to sky)' : 'LAND (move to runway)';
});

// Start
overlay.style.display = 'flex';
updateHUD();
requestAnimationFrame(gameLoop);

