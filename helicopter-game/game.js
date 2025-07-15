// James and Daddy's Hitting Brown Helicopter Game

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game settings
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
const PLAYER_WIDTH = 80;
const PLAYER_HEIGHT = 40;
const PLAYER_Y = GAME_HEIGHT - 60;
const PLAYER_SPEED = 8;
const PROJECTILE_WIDTH = 10;
const PROJECTILE_HEIGHT = 25;
const PROJECTILE_SPEED = 12;
const HELICOPTER_WIDTH = 90;
const HELICOPTER_HEIGHT = 40;
const HELICOPTER_SPEED = 3;
const HELICOPTER_SPAWN_INTERVAL = 1200; // ms
const WIN_SCORE = 10;
let seagulls = [];
let seagullScore = 0;
const SEAGULL_WIDTH = 60;
const SEAGULL_HEIGHT = 40;
const SEAGULL_SPEED = 4;
const SEAGULL_SPAWN_INTERVAL = 2000; // ms
const SEAGULL_WIN_SCORE = 5;
let lastSeagullSpawn = 0;
let siaFlyMsgTimeout = null;
let showSiaFlyMsg = false;
let seagullBullets = [];
const SEAGULL_BULLET_WIDTH = 24;
const SEAGULL_BULLET_HEIGHT = 24;
const SEAGULL_BULLET_SPEED = 7;
const SEAGULL_BULLET_EMOJI = '💩';

// Game state
let playerX = GAME_WIDTH / 2 - PLAYER_WIDTH / 2;
let leftPressed = false;
let rightPressed = false;
let projectiles = [];
let helicopters = [];
let score = 0;
let gameOver = false;
let lastHelicopterSpawn = 0;

// Mobile controls
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let tiltX = 0;

// Player drawing
function drawPlayer() {
    ctx.save();
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔫', playerX + PLAYER_WIDTH / 2, PLAYER_Y + PLAYER_HEIGHT / 2);
    ctx.restore();
}

// Helicopter drawing
function drawHelicopter(heli) {
    ctx.save();
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(heli.x + HELICOPTER_WIDTH/2, heli.y + HELICOPTER_HEIGHT/2);
    // Always draw the emoji facing right, no flipping
    ctx.fillText('🚁', 0, 0);
    ctx.restore();
}

// Projectile drawing
function drawProjectile(p) {
    ctx.fillStyle = '#ffd600';
    ctx.fillRect(p.x, p.y, PROJECTILE_WIDTH, PROJECTILE_HEIGHT);
}

// Seagull drawing
function drawSeagull(sea) {
    ctx.save();
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(sea.x + SEAGULL_WIDTH/2, sea.y + SEAGULL_HEIGHT/2);
    ctx.fillText('🕊️', 0, 0);
    ctx.restore();
}

// Seagull bullet drawing
function drawSeagullBullet(b) {
    ctx.save();
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(SEAGULL_BULLET_EMOJI, b.x + SEAGULL_BULLET_WIDTH/2, b.y + SEAGULL_BULLET_HEIGHT/2);
    ctx.restore();
}

// Spawn a helicopter
function spawnHelicopter() {
    const dir = 'left'; // Only move left
    const y = 40 + Math.random() * 80;
    let x = GAME_WIDTH; // Always start from the right
    helicopters.push({ x, y, dir });
}

// Spawn a seagull
function spawnSeagull() {
    const dir = 'left';
    const y = 40 + Math.random() * 80;
    let x = GAME_WIDTH;
    seagulls.push({ x, y, dir });
}

// Update game state
function update(dt) {
    // Player movement
    if (leftPressed) playerX -= PLAYER_SPEED;
    if (rightPressed) playerX += PLAYER_SPEED;
    if (isMobile && Math.abs(tiltX) > 2) playerX += tiltX * 0.8;
    playerX = Math.max(0, Math.min(GAME_WIDTH - PLAYER_WIDTH, playerX));

    // Projectiles
    for (let p of projectiles) {
        p.y -= PROJECTILE_SPEED;
    }
    projectiles = projectiles.filter(p => p.y + PROJECTILE_HEIGHT > 0);

    // Helicopters
    for (let h of helicopters) {
        if (h.dir === 'left') h.x -= HELICOPTER_SPEED;
        else h.x += HELICOPTER_SPEED;
    }
    helicopters = helicopters.filter(h => h.x + HELICOPTER_WIDTH > 0 && h.x < GAME_WIDTH);

    // Seagulls
    for (let s of seagulls) {
        if (s.dir === 'left') s.x -= SEAGULL_SPEED;
        else s.x += SEAGULL_SPEED;
        // Randomly drop a bullet
        if (Math.random() < 0.012) { // ~1.2% chance per frame per seagull
            seagullBullets.push({
                x: s.x + SEAGULL_WIDTH/2 - SEAGULL_BULLET_WIDTH/2,
                y: s.y + SEAGULL_HEIGHT
            });
        }
    }
    seagulls = seagulls.filter(s => s.x + SEAGULL_WIDTH > 0 && s.x < GAME_WIDTH);
    // Seagull bullets
    for (let b of seagullBullets) {
        b.y += SEAGULL_BULLET_SPEED;
    }
    seagullBullets = seagullBullets.filter(b => b.y < GAME_HEIGHT);
    // Seagull bullet collision with player
    for (let b of seagullBullets) {
        if (
            b.x < playerX + PLAYER_WIDTH &&
            b.x + SEAGULL_BULLET_WIDTH > playerX &&
            b.y < PLAYER_Y + PLAYER_HEIGHT &&
            b.y + SEAGULL_BULLET_HEIGHT > PLAYER_Y
        ) {
            endGame();
            break;
        }
    }

    // Seagull collisions
    for (let i = seagulls.length - 1; i >= 0; i--) {
        const s = seagulls[i];
        for (let j = projectiles.length - 1; j >= 0; j--) {
            const p = projectiles[j];
            if (
                p.x < s.x + SEAGULL_WIDTH &&
                p.x + PROJECTILE_WIDTH > s.x &&
                p.y < s.y + SEAGULL_HEIGHT &&
                p.y + PROJECTILE_HEIGHT > s.y
            ) {
                seagulls.splice(i, 1);
                projectiles.splice(j, 1);
                seagullScore++;
                updateSeagullProgressBar();
                triggerSiaFlyMsg();
                break;
            }
        }
    }

    // Collisions
    for (let i = helicopters.length - 1; i >= 0; i--) {
        const h = helicopters[i];
        for (let j = projectiles.length - 1; j >= 0; j--) {
            const p = projectiles[j];
            if (
                p.x < h.x + HELICOPTER_WIDTH &&
                p.x + PROJECTILE_WIDTH > h.x &&
                p.y < h.y + HELICOPTER_HEIGHT &&
                p.y + PROJECTILE_HEIGHT > h.y
            ) {
                helicopters.splice(i, 1);
                projectiles.splice(j, 1);
                score++;
                updateProgressBar();
                if (score >= WIN_SCORE) {
                    endGame();
                }
                break;
            }
        }
    }
}

// Draw everything
function draw() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    drawPlayer();
    for (let h of helicopters) drawHelicopter(h);
    for (let s of seagulls) drawSeagull(s);
    for (let p of projectiles) drawProjectile(p);
    for (let b of seagullBullets) drawSeagullBullet(b);
    // Score
    ctx.fillStyle = '#6d4c1b';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('Score: ' + score, 20, 50);
    // Seagull Score
    ctx.fillStyle = '#1b6d4c';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('Seagulls: ' + seagullScore, 20, 90);
    // Sia flies message
    if (showSiaFlyMsg) {
        ctx.save();
        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = '#0077ff';
        ctx.textAlign = 'center';
        ctx.fillText('Sia flies!', GAME_WIDTH/2, GAME_HEIGHT/2);
        ctx.restore();
    }
}

// Game loop
let lastTime = 0;
function gameLoop(ts) {
    if (gameOver) return;
    const dt = ts - lastTime;
    lastTime = ts;
    if (ts - lastHelicopterSpawn > HELICOPTER_SPAWN_INTERVAL) {
        spawnHelicopter();
        lastHelicopterSpawn = ts;
    }
    if (ts - lastSeagullSpawn > SEAGULL_SPAWN_INTERVAL) {
        spawnSeagull();
        lastSeagullSpawn = ts;
    }
    update(dt);
    draw();
    requestAnimationFrame(gameLoop);
}

// Controls
function shoot() {
    if (gameOver) return;
    projectiles.push({
        x: playerX + PLAYER_WIDTH/2 - PROJECTILE_WIDTH/2,
        y: PLAYER_Y - PROJECTILE_HEIGHT
    });
}

document.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') leftPressed = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') rightPressed = true;
    if (e.code === 'Space') shoot();
});
document.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') leftPressed = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') rightPressed = false;
});

// Mobile: tap anywhere to shoot, tilt to move
if (isMobile) {
    window.addEventListener('deviceorientation', function(event) {
        // Smoother, less sensitive tilt
        tiltX = (event.gamma || 0) * 0.7;
    });
    // Tap anywhere to shoot
    function mobileShootHandler(e) {
        e.preventDefault();
        shoot();
    }
    document.body.addEventListener('touchstart', mobileShootHandler, { passive: false });
    // Prevent scrolling when touching the game area
    document.body.addEventListener('touchmove', function(e) {
        if (e.target === canvas || e.target === document.body) {
            e.preventDefault();
        }
    }, { passive: false });
}

// Progress bar
function updateProgressBar() {
    const bar = document.getElementById('progress-bar');
    bar.style.width = Math.min(100, (score / WIN_SCORE) * 100) + '%';
}

// Seagull Progress bar
function updateSeagullProgressBar() {
    const bar = document.getElementById('seagull-progress-bar');
    if (bar) bar.style.width = Math.min(100, (seagullScore / SEAGULL_WIN_SCORE) * 100) + '%';
}

// End game
function endGame() {
    gameOver = true;
    document.getElementById('trophy-restart').style.display = 'flex';
}

function triggerSiaFlyMsg() {
    showSiaFlyMsg = true;
    if (siaFlyMsgTimeout) clearTimeout(siaFlyMsgTimeout);
    siaFlyMsgTimeout = setTimeout(() => {
        showSiaFlyMsg = false;
    }, 2000);
}

document.getElementById('restart-btn').onclick = function() {
    // Reset game state
    playerX = GAME_WIDTH / 2 - PLAYER_WIDTH / 2;
    leftPressed = false;
    rightPressed = false;
    projectiles = [];
    helicopters = [];
    seagulls = [];
    seagullBullets = [];
    score = 0;
    seagullScore = 0;
    gameOver = false;
    lastHelicopterSpawn = 0;
    lastSeagullSpawn = 0;
    updateProgressBar();
    updateSeagullProgressBar();
    document.getElementById('trophy-restart').style.display = 'none';
    requestAnimationFrame(gameLoop);
};

// Start game
updateProgressBar();
updateSeagullProgressBar();
requestAnimationFrame(gameLoop); 