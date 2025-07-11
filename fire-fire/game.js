// Fire Fire! Shoot the Fire!
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game settings
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
const FIRETRUCK_WIDTH = 90;
const FIRETRUCK_HEIGHT = 60;
const FIRETRUCK_Y = GAME_HEIGHT - FIRETRUCK_HEIGHT - 10;
const FIRETRUCK_SPEED = 7;
const WATER_WIDTH = 10;
const WATER_HEIGHT = 30;
const WATER_SPEED = 12;
const FIRE_SIZE = 40;
const FIRE_DURATION = 6000; // ms
const SPAWN_INTERVAL = 1800; // ms

// Tree and house types
const TREE_TYPES = ['pine', 'oak', 'palm'];
const HOUSE_TYPES = ['small', 'tall', 'cottage'];

let leftPressed = false;
let rightPressed = false;
 let upPressed = false;
let downPressed = false;
let spacePressed = false;
let score = 0;
let gameOver = false;
const WIN_SCORE = 20; // Number of fires to win
let won = false;

const FIRETRUCK_EMOJI = '🚒';
const FIRETRUCK_MIN_Y = GAME_HEIGHT - FIRETRUCK_HEIGHT - 70;
const FIRETRUCK_MAX_Y = GAME_HEIGHT - FIRETRUCK_HEIGHT - 10;

const firetruck = {
    x: GAME_WIDTH / 2 - FIRETRUCK_WIDTH / 2,
    y: FIRETRUCK_MAX_Y,
    width: FIRETRUCK_WIDTH,
    height: FIRETRUCK_HEIGHT,
    color: '#d84315',
    phase: Math.random() * Math.PI * 2, // can be removed, but harmless
    moveLeft() { this.x = Math.max(0, this.x - FIRETRUCK_SPEED); },
    moveRight() { this.x = Math.min(GAME_WIDTH - this.width, this.x + FIRETRUCK_SPEED); },
    moveUp() { this.y = Math.max(FIRETRUCK_MIN_Y, this.y - 7); },
    moveDown() { this.y = Math.min(FIRETRUCK_MAX_Y, this.y + 7); },
    draw() {
        ctx.save();
        ctx.font = '64px serif';
        ctx.textAlign = 'left';
        ctx.fillText(FIRETRUCK_EMOJI, this.x, this.y + this.height - 5);
        ctx.restore();
    }
};

let waters = [];
let fires = [];
let lastSpawn = 0;
let lastTime = 0;

function drawTree(type, x, y) {
    ctx.save();
    ctx.font = '60px serif';
    ctx.textAlign = 'left';
    let emoji = '🌳';
    if (type === 'pine') emoji = '🌲';
    if (type === 'oak') emoji = '🌳';
    if (type === 'palm') emoji = '🌴';
    ctx.fillText(emoji, x, y + 65);
    ctx.restore();
}

function drawHouse(type, x, y) {
    ctx.save();
    ctx.font = '60px serif';
    ctx.textAlign = 'left';
    let emoji = '🏠';
    if (type === 'small') emoji = '🏠';
    if (type === 'tall') emoji = '🏢';
    if (type === 'cottage') emoji = '🏡';
    ctx.fillText(emoji, x, y + 65);
    ctx.restore();
}

function drawFire(x, y) {
    ctx.save();
    ctx.font = '56px serif';
    ctx.textAlign = 'left';
    ctx.fillText('🔥', x + 10, y + 60);
    ctx.restore();
}

function spawnFire() {
    const isTree = Math.random() < 0.5;
    let type, x, y;
    x = Math.random() * (GAME_WIDTH - 60);
    y = Math.random() * (GAME_HEIGHT * 0.5 - 70) + 10;
    if (isTree) {
        type = TREE_TYPES[Math.floor(Math.random() * TREE_TYPES.length)];
    } else {
        type = HOUSE_TYPES[Math.floor(Math.random() * HOUSE_TYPES.length)];
    }
    fires.push({ x, y, type, isTree, spawnTime: Date.now() });
}

function drawFires() {
    for (const fire of fires) {
        if (fire.isTree) {
            drawTree(fire.type, fire.x, fire.y);
        } else {
            drawHouse(fire.type, fire.x, fire.y);
        }
        drawFire(fire.x, fire.y);
    }
}

function drawWaters() {
    ctx.save();
    ctx.font = '48px serif';
    ctx.textAlign = 'left';
    for (const water of waters) {
        ctx.fillText('💧', water.x, water.y + 42);
    }
    ctx.restore();
}

function updateWaters() {
    for (const water of waters) {
        water.y -= WATER_SPEED;
    }
    // Remove off-screen
    waters = waters.filter(w => w.y + WATER_HEIGHT > 0);
}

function checkCollisions() {
    for (let i = fires.length - 1; i >= 0; i--) {
        const fire = fires[i];
        for (let j = waters.length - 1; j >= 0; j--) {
            const water = waters[j];
            if (
                water.x < fire.x + 50 &&
                water.x + WATER_WIDTH > fire.x &&
                water.y < fire.y + 50 &&
                water.y + WATER_HEIGHT > fire.y
            ) {
                // Hit!
                fires.splice(i, 1);
                waters.splice(j, 1);
                score++;
                break;
            }
        }
    }
}

function updateFires() {
    // Fires now stay burning forever; do nothing here
}

function drawScore() {
    ctx.save();
    ctx.font = '28px Arial';
    ctx.fillStyle = '#d84315';
    ctx.fillText('Score: ' + score, 30, 40);
    ctx.restore();
}

function drawGameOver() {
    ctx.save();
    ctx.font = '60px Arial';
    ctx.fillStyle = '#d84315';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30);
    ctx.font = '36px Arial';
    ctx.fillText('Final Score: ' + score, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
    ctx.restore();
}

function updateProgressBar() {
    const bar = document.getElementById('progress-bar');
    const percent = Math.min(100, (score / WIN_SCORE) * 100);
    bar.style.width = percent + '%';
}

function showTrophy() {
    document.getElementById('trophy-restart').style.display = 'flex';
}

function hideTrophy() {
    document.getElementById('trophy-restart').style.display = 'none';
}

function resetGame() {
    score = 0;
    gameOver = false;
    won = false;
    fires = [];
    waters = [];
    lastSpawn = 0;
    lastTime = 0;
    updateProgressBar();
    hideTrophy();
    requestAnimationFrame(gameLoop);
}

function gameLoop(ts) {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    if (gameOver) {
        drawGameOver();
        return;
    }
    if (won) {
        // Show trophy and stop game
        showTrophy();
        return;
    }
    // Move firetruck
    if (leftPressed) firetruck.moveLeft();
    if (rightPressed) firetruck.moveRight();
    if (upPressed) firetruck.moveUp();
    if (downPressed) firetruck.moveDown();
    // Draw
    firetruck.draw();
    drawFires();
    drawWaters();
    drawScore();
    updateProgressBar();
    // Update
    updateWaters();
    checkCollisions();
    updateFires();
    // Win condition
    if (score >= WIN_SCORE) {
        won = true;
        updateProgressBar();
        showTrophy();
        return;
    }
    // Spawn fires
    if (!lastTime || ts - lastSpawn > SPAWN_INTERVAL - Math.min(score * 40, 1200)) {
        spawnFire();
        lastSpawn = ts;
    }
    lastTime = ts;
    requestAnimationFrame(gameLoop);
}

// Controls
window.addEventListener('keydown', e => {
    if (e.key === ' ' && !spacePressed && !gameOver) {
        e.preventDefault();
    }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') leftPressed = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') rightPressed = true;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') upPressed = true;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') downPressed = true;
    if (e.key === ' ' && !spacePressed && !gameOver) {
        // Shoot water
        waters.push({
            x: firetruck.x + firetruck.width / 2 - WATER_WIDTH / 2,
            y: firetruck.y - WATER_HEIGHT,
        });
        spacePressed = true;
    }
});
window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') leftPressed = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') rightPressed = false;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') upPressed = false;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') downPressed = false;
    if (e.key === ' ') spacePressed = false;
});

// Start game
requestAnimationFrame(gameLoop);
document.getElementById('restart-btn').onclick = resetGame;
updateProgressBar(); 