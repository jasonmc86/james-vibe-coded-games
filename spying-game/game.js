// James and Daddy's Spying Game - Two zones!
// UP ZONE = Night time: stars, moon, earth, sun, Saturn (no people/animals).
// DOWN ZONE = Morning time: big king house.

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
const TELESCOPE_RADIUS = 85;
const WIN_COUNT = 10;
const NIGHT_ZONE_TOP = 0;           // y from 0 to 0.5 = night
const NIGHT_ZONE_BOTTOM = 0.5;
const MORNING_ZONE_TOP = 0.5;       // y from 0.5 to 1 = morning
const MORNING_ZONE_BOTTOM = 1;

// Stars only in the NIGHT (top) zone - fraction of canvas
const STARS = [];
for (let i = 0; i < 100; i++) {
    STARS.push({
        x: Math.random(),
        y: Math.random() * 0.48,  // only in top half
        size: 0.4 + Math.random() * 1.2,
        twinkle: Math.random() * Math.PI * 2
    });
}

// Things to spot: NIGHT zone = moon, earth, sun, Saturn, stars. MORNING zone = house.
const CHARACTERS = [
    { emoji: '🌙', x: 0.12, y: 0.12, spotted: false },   // Moon - night
    { emoji: '🌍', x: 0.88, y: 0.18, spotted: false },   // Earth - night
    { emoji: '☀️', x: 0.5, y: 0.08, spotted: false },   // Sun - night
    { emoji: '🪐', x: 0.22, y: 0.28, spotted: false },  // Saturn - night
    { emoji: '⭐', x: 0.75, y: 0.1, spotted: false },   // Star - night
    { emoji: '🌟', x: 0.35, y: 0.2, spotted: false },   // Star - night
    { emoji: '⭐', x: 0.65, y: 0.35, spotted: false },  // Star - night
    { emoji: '🌟', x: 0.15, y: 0.4, spotted: false },  // Star - night
    { emoji: '⭐', x: 0.85, y: 0.42, spotted: false },  // Star - night
    { emoji: '🏠', x: 0.5, y: 0.78, spotted: false },  // House - morning (big house drawn below)
];

let mouseX = GAME_WIDTH / 2;
let mouseY = GAME_HEIGHT / 2;
let score = 0;
let gameWon = false;
let rect = null;

function getCanvasCoords(e) {
    if (!rect) rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

canvas.addEventListener('mousemove', function(e) {
    const coords = getCanvasCoords(e);
    mouseX = coords.x;
    mouseY = coords.y;
});

canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    const coords = getCanvasCoords(e);
    mouseX = coords.x;
    mouseY = coords.y;
}, { passive: false });

canvas.addEventListener('touchstart', function(e) {
    if (e.touches.length) {
        const coords = getCanvasCoords(e);
        mouseX = coords.x;
        mouseY = coords.y;
    }
});

window.addEventListener('resize', function() {
    rect = canvas.getBoundingClientRect();
});

function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

function drawBigHouse() {
    // Big King house in the morning (down) zone - centered, large
    const cx = GAME_WIDTH * 0.5;
    const houseW = GAME_WIDTH * 0.55;
    const houseH = GAME_HEIGHT * 0.42;
    const topY = GAME_HEIGHT * 0.48;

    // Main body (rectangle) - very light
    ctx.fillStyle = '#faf6ef';
    ctx.strokeStyle = '#e0d8c8';
    ctx.lineWidth = 4;
    ctx.fillRect(cx - houseW / 2, topY, houseW, houseH);
    ctx.strokeRect(cx - houseW / 2, topY, houseW, houseH);

    // Roof (triangle) - big and king, light
    ctx.fillStyle = '#e8e2d8';
    ctx.strokeStyle = '#d4cec4';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - houseW / 2 - 20, topY);
    ctx.lineTo(cx, topY - houseH * 0.55);
    ctx.lineTo(cx + houseW / 2 + 20, topY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Door (big) - light but visible
    const doorW = houseW * 0.22;
    const doorH = houseH * 0.5;
    ctx.fillStyle = '#e5ddd0';
    ctx.strokeStyle = '#c9c0b0';
    ctx.fillRect(cx - doorW / 2, topY + houseH - doorH, doorW, doorH);
    ctx.strokeRect(cx - doorW / 2, topY + houseH - doorH, doorW, doorH);
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(cx + doorW * 0.3, topY + houseH - doorH * 0.5, 8, 0, Math.PI * 2);
    ctx.fill();

    // Windows (two big ones) - bright sky blue
    const winW = houseW * 0.18;
    const winH = houseH * 0.22;
    ctx.fillStyle = '#b8e0f8';
    ctx.strokeStyle = '#7eb8d0';
    ctx.lineWidth = 3;
    ctx.fillRect(cx - houseW * 0.35, topY + houseH * 0.2, winW, winH);
    ctx.strokeRect(cx - houseW * 0.35, topY + houseH * 0.2, winW, winH);
    ctx.fillRect(cx + houseW * 0.18, topY + houseH * 0.2, winW, winH);
    ctx.strokeRect(cx + houseW * 0.18, topY + houseH * 0.2, winW, winH);
    // Window cross
    ctx.strokeStyle = '#7eb8d0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - houseW * 0.26, topY + houseH * 0.2);
    ctx.lineTo(cx - houseW * 0.26, topY + houseH * 0.42);
    ctx.moveTo(cx - houseW * 0.35, topY + houseH * 0.31);
    ctx.lineTo(cx - houseW * 0.17, topY + houseH * 0.31);
    ctx.moveTo(cx + houseW * 0.27, topY + houseH * 0.2);
    ctx.lineTo(cx + houseW * 0.27, topY + houseH * 0.42);
    ctx.moveTo(cx + houseW * 0.18, topY + houseH * 0.31);
    ctx.lineTo(cx + houseW * 0.36, topY + houseH * 0.31);
    ctx.stroke();

    // Chimney - light
    ctx.fillStyle = '#e0d8cc';
    ctx.strokeStyle = '#c9c0b0';
    ctx.fillRect(cx + houseW * 0.28, topY - houseH * 0.15, houseW * 0.12, houseH * 0.35);
    ctx.strokeRect(cx + houseW * 0.28, topY - houseH * 0.15, houseW * 0.12, houseH * 0.35);
    ctx.fillStyle = '#c0b8a8';
    ctx.fillRect(cx + houseW * 0.28, topY - houseH * 0.18, houseW * 0.12, houseH * 0.05);
}

function drawScene() {
    const midY = GAME_HEIGHT * 0.5;

    // ----- UP ZONE: NIGHT TIME (top half) -----
    const nightBg = ctx.createLinearGradient(0, 0, 0, midY);
    nightBg.addColorStop(0, '#0f0f2e');
    nightBg.addColorStop(0.5, '#1a1a4a');
    nightBg.addColorStop(1, '#252550');
    ctx.fillStyle = nightBg;
    ctx.fillRect(0, 0, GAME_WIDTH, midY);

    // Stars only in night zone
    const t = Date.now() * 0.002;
    STARS.forEach(function(s) {
        const sx = s.x * GAME_WIDTH;
        const sy = s.y * GAME_HEIGHT;
        const r = 1 + 0.4 * Math.sin(t + s.twinkle);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.7 * r) + ')';
        ctx.beginPath();
        ctx.arc(sx, sy, s.size * 2, 0, Math.PI * 2);
        ctx.fill();
    });

    // ----- DOWN ZONE: MORNING TIME (bottom half) -----
    const morningBg = ctx.createLinearGradient(0, midY, 0, GAME_HEIGHT);
    morningBg.addColorStop(0, '#87ceeb');
    morningBg.addColorStop(0.25, '#b0e0e6');
    morningBg.addColorStop(0.5, '#ffd89b');
    morningBg.addColorStop(0.75, '#ffb347');
    morningBg.addColorStop(1, '#e8d5b7');
    ctx.fillStyle = morningBg;
    ctx.fillRect(0, midY, GAME_WIDTH, GAME_HEIGHT - midY);

    // Ground line under house
    ctx.fillStyle = '#7cb342';
    ctx.fillRect(0, GAME_HEIGHT * 0.88, GAME_WIDTH, GAME_HEIGHT);

    // Big King house (drawn in morning zone)
    drawBigHouse();

    // Draw things to spot (moon, earth, sun, Saturn, stars in night; house emoji in morning)
    const size = Math.min(GAME_WIDTH, GAME_HEIGHT) * 0.1;
    ctx.font = `${size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    CHARACTERS.forEach(function(c) {
        const px = c.x * GAME_WIDTH;
        const py = c.y * GAME_HEIGHT;
        if (c.spotted) {
            ctx.globalAlpha = 0.65;
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#ffeb3b';
            ctx.lineWidth = 4;
            ctx.strokeText(c.emoji, px, py);
            ctx.fillText(c.emoji, px, py);
            ctx.globalAlpha = 1;
        } else {
            ctx.fillText(c.emoji, px, py);
        }
    });
}

function drawDarkOverlay() {
    // Brighter overlay so the telescope view feels brighter
    ctx.fillStyle = 'rgba(25, 20, 55, 0.78)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

function drawTelescopeHole() {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, TELESCOPE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawTelescopeRing() {
    // Telescope lens look: dark tube rim + metallic ring
    const r = TELESCOPE_RADIUS;
    ctx.strokeStyle = '#2a2540';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, r + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#6b5b7a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#a090b0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, r - 2, 0, Math.PI * 2);
    ctx.stroke();
}

function checkSpotted() {
    CHARACTERS.forEach(function(c) {
        if (c.spotted) return;
        const px = c.x * GAME_WIDTH;
        const py = c.y * GAME_HEIGHT;
        const dist = distance(mouseX, mouseY, px, py);
        if (dist < TELESCOPE_RADIUS + 20) {
            c.spotted = true;
            score++;
            updateUI();
            if (score >= WIN_COUNT) {
                gameWon = true;
                document.getElementById('progress-bar').style.width = '100%';
                document.getElementById('trophy-restart').style.display = 'flex';
                document.getElementById('score-text').style.display = 'none';
                document.getElementById('dance-message').style.display = 'block';
            }
        }
    });
}

function updateUI() {
    document.getElementById('score-text').textContent = 'Spotted: ' + score + ' / ' + WIN_COUNT;
    const pct = (score / WIN_COUNT) * 100;
    document.getElementById('progress-bar').style.width = pct + '%';
}

function gameLoop() {
    rect = canvas.getBoundingClientRect();
    drawScene();
    drawDarkOverlay();
    drawTelescopeHole();
    drawTelescopeRing();
    if (!gameWon) checkSpotted();
    requestAnimationFrame(gameLoop);
}

document.getElementById('restart-btn').addEventListener('click', function() {
    CHARACTERS.forEach(function(c) { c.spotted = false; });
    score = 0;
    gameWon = false;
    updateUI();
    document.getElementById('progress-bar').style.width = '0%';
    document.getElementById('trophy-restart').style.display = 'none';
    document.getElementById('score-text').style.display = '';
    document.getElementById('dance-message').style.display = 'none';
});

gameLoop();
updateUI();
