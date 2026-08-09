const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');

const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
const GRAVITY = 0.28;
const FLOOR_Y = GAME_HEIGHT - 38;
const WIN_SCORE = 25;

let gameStarted = false;
let gameOver = false;
let score = 0;
let lives = 5;
let level = 1;
let combo = 0;
let slowTimer = 0;
let dropTimer = 0;
let messageTimer = 0;
let message = 'Press Start Game!';
let balls = [];
let sparkles = [];
let keys = { left: false, right: false };

const bucket = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 96,
    width: 145,
    height: 70,
    speed: 9,
    targetX: GAME_WIDTH / 2
};

const ballTypes = [
    { name: 'normal', points: 1, color: '#ff5b6e', stripe: '#ffd166', chance: 0.58 },
    { name: 'bonus', points: 3, color: '#f7d51d', stripe: '#20c997', chance: 0.18 },
    { name: 'slow', points: 1, color: '#3ea5ff', stripe: '#ffffff', chance: 0.14 },
    { name: 'spiky', points: -1, color: '#2d3142', stripe: '#ff4d4d', chance: 0.10 }
];

function startGame() {
    score = 0;
    lives = 5;
    level = 1;
    combo = 0;
    slowTimer = 0;
    dropTimer = 0;
    messageTimer = 120;
    message = 'Here comes the big drop!';
    balls = [];
    sparkles = [];
    bucket.x = GAME_WIDTH / 2;
    bucket.targetX = bucket.x;
    gameStarted = true;
    gameOver = false;
    canvas.focus();
    updateScore();
}

function updateScore() {
    if (!gameStarted) {
        scoreEl.textContent = 'Catch 25 bouncy balls to win! Avoid the spiky balls.';
        return;
    }

    if (gameOver) {
        scoreEl.textContent = message;
        return;
    }

    const slowText = slowTimer > 0 ? ' | Slow motion!' : '';
    scoreEl.textContent = `Score: ${score}/${WIN_SCORE} | Lives: ${lives} | Level: ${level} | Combo: ${combo}${slowText}`;
}

function chooseBallType() {
    const roll = Math.random();
    let total = 0;

    for (const type of ballTypes) {
        total += type.chance;
        if (roll <= total) {
            return type;
        }
    }

    return ballTypes[0];
}

function spawnBall() {
    const type = chooseBallType();
    const radius = type.name === 'spiky' ? 24 : 20 + Math.random() * 13;
    balls.push({
        x: 60 + Math.random() * (GAME_WIDTH - 120),
        y: -radius,
        vx: (Math.random() - 0.5) * (3 + level * 0.35),
        vy: 1.5 + Math.random() * 1.6 + level * 0.25,
        radius,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.18,
        bounces: 0,
        type
    });
}

function createSparkles(x, y, color, amount) {
    for (let i = 0; i < amount; i++) {
        sparkles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 9,
            vy: -Math.random() * 7 - 1,
            life: 35 + Math.random() * 20,
            color,
            size: 3 + Math.random() * 5
        });
    }
}

function catchBall(ball) {
    if (ball.type.name === 'spiky') {
        lives--;
        combo = 0;
        message = 'Ouch! Spiky ball!';
        messageTimer = 80;
        createSparkles(ball.x, bucket.y, '#ff4d4d', 18);
    } else {
        combo++;
        const comboBonus = combo > 0 && combo % 5 === 0 ? 2 : 0;
        score += ball.type.points + comboBonus;
        message = comboBonus ? 'Mega bounce combo!' : 'Boing! Caught one!';
        messageTimer = 55;
        createSparkles(ball.x, bucket.y, ball.type.color, 16);

        if (ball.type.name === 'slow') {
            slowTimer = 300;
            message = 'Blue ball slow motion!';
        }
    }

    level = Math.min(8, 1 + Math.floor(score / 5));

    if (score >= WIN_SCORE) {
        gameOver = true;
        message = 'You won The Big Drop of Bouncy Balls!';
        createSparkles(bucket.x, bucket.y - 40, '#f7d51d', 70);
    } else if (lives <= 0) {
        gameOver = true;
        message = 'Game over! Press Start Game to try again.';
    }

    updateScore();
}

function updateBucket() {
    if (keys.left) {
        bucket.targetX -= bucket.speed;
    }
    if (keys.right) {
        bucket.targetX += bucket.speed;
    }

    bucket.targetX = Math.max(bucket.width / 2, Math.min(GAME_WIDTH - bucket.width / 2, bucket.targetX));
    bucket.x += (bucket.targetX - bucket.x) * 0.32;
}

function updateBalls() {
    const speedScale = slowTimer > 0 ? 0.58 : 1;
    dropTimer--;

    if (dropTimer <= 0) {
        spawnBall();
        dropTimer = Math.max(14, 62 - level * 5);
    }

    for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
        ball.vy += GRAVITY * speedScale;
        ball.x += ball.vx * speedScale;
        ball.y += ball.vy * speedScale;
        ball.rotation += ball.spin;

        if (ball.x - ball.radius < 0 || ball.x + ball.radius > GAME_WIDTH) {
            ball.vx *= -0.82;
            ball.x = Math.max(ball.radius, Math.min(GAME_WIDTH - ball.radius, ball.x));
        }

        if (ball.y + ball.radius > FLOOR_Y) {
            ball.y = FLOOR_Y - ball.radius;
            ball.vy *= -0.62;
            ball.vx *= 0.94;
            ball.bounces++;
            createSparkles(ball.x, FLOOR_Y, ball.type.color, 5);
        }

        const bucketLeft = bucket.x - bucket.width / 2;
        const bucketRight = bucket.x + bucket.width / 2;
        const bucketTop = bucket.y - bucket.height / 2;
        const bucketBottom = bucket.y + bucket.height / 2;
        const fallingIntoBucket = ball.vy > 0 && ball.x > bucketLeft && ball.x < bucketRight &&
            ball.y + ball.radius > bucketTop && ball.y - ball.radius < bucketBottom;

        if (fallingIntoBucket) {
            catchBall(ball);
            balls.splice(i, 1);
            continue;
        }

        if (ball.bounces > 3 || ball.y - ball.radius > GAME_HEIGHT + 80) {
            if (ball.type.name !== 'spiky') {
                lives--;
                combo = 0;
                message = 'A bouncy ball got away!';
                messageTimer = 70;
            }

            balls.splice(i, 1);

            if (lives <= 0) {
                gameOver = true;
                message = 'Game over! Press Start Game to try again.';
            }

            updateScore();
        }
    }

    if (slowTimer > 0) {
        slowTimer--;
        if (slowTimer === 0) {
            updateScore();
        }
    }
}

function updateSparkles() {
    for (let i = sparkles.length - 1; i >= 0; i--) {
        const sparkle = sparkles[i];
        sparkle.x += sparkle.vx;
        sparkle.y += sparkle.vy;
        sparkle.vy += 0.22;
        sparkle.life--;

        if (sparkle.life <= 0) {
            sparkles.splice(i, 1);
        }
    }
}

function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    sky.addColorStop(0, '#6fd7ff');
    sky.addColorStop(0.55, '#b9f3ff');
    sky.addColorStop(1, '#7acb6d');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#ffffff';
    drawCloud(120, 95, 1.1);
    drawCloud(460, 72, 0.8);
    drawCloud(910, 105, 1.2);

    ctx.fillStyle = '#3e9f50';
    ctx.fillRect(0, FLOOR_Y, GAME_WIDTH, GAME_HEIGHT - FLOOR_Y);

    ctx.fillStyle = '#2c7f3d';
    for (let x = 0; x < GAME_WIDTH; x += 42) {
        ctx.beginPath();
        ctx.moveTo(x, FLOOR_Y + 20);
        ctx.lineTo(x + 18, FLOOR_Y - 4);
        ctx.lineTo(x + 36, FLOOR_Y + 20);
        ctx.fill();
    }
}

function drawCloud(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.arc(0, 20, 28, 0, Math.PI * 2);
    ctx.arc(32, 10, 36, 0, Math.PI * 2);
    ctx.arc(70, 22, 28, 0, Math.PI * 2);
    ctx.arc(38, 32, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawBucket() {
    ctx.save();
    ctx.translate(bucket.x, bucket.y);

    ctx.fillStyle = '#ff8a3d';
    ctx.beginPath();
    ctx.moveTo(-bucket.width / 2, -bucket.height / 2);
    ctx.lineTo(bucket.width / 2, -bucket.height / 2);
    ctx.lineTo(bucket.width / 2 - 20, bucket.height / 2);
    ctx.lineTo(-bucket.width / 2 + 20, bucket.height / 2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#8b3f18';
    ctx.lineWidth = 7;
    ctx.stroke();

    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, -bucket.height / 2, 56, Math.PI, 0);
    ctx.stroke();

    ctx.fillStyle = '#ffe8bd';
    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CATCH!', 0, 10);
    ctx.restore();
}

function drawBall(ball) {
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.rotation);

    if (ball.type.name === 'spiky') {
        ctx.fillStyle = ball.type.color;
        ctx.beginPath();
        for (let i = 0; i < 16; i++) {
            const radius = i % 2 === 0 ? ball.radius + 11 : ball.radius - 4;
            const angle = (Math.PI * 2 * i) / 16;
            ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = ball.type.stripe;
        ctx.beginPath();
        ctx.arc(0, 0, ball.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
    } else {
        const gradient = ctx.createRadialGradient(-ball.radius / 3, -ball.radius / 3, 4, 0, 0, ball.radius);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.22, ball.type.stripe);
        gradient.addColorStop(1, ball.type.color);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, ball.radius * 0.62, -0.9, 0.9);
        ctx.stroke();
    }

    ctx.restore();
}

function drawSparkles() {
    sparkles.forEach(sparkle => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, sparkle.life / 45);
        ctx.fillStyle = sparkle.color;
        ctx.beginPath();
        ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function drawMessage() {
    if (messageTimer <= 0 && !gameOver && gameStarted) {
        return;
    }

    const boxWidth = gameOver ? 760 : 620;
    const boxX = GAME_WIDTH / 2 - boxWidth / 2;

    ctx.save();
    ctx.fillStyle = gameOver ? 'rgba(20, 53, 72, 0.92)' : 'rgba(20, 53, 72, 0.78)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    roundRect(ctx, boxX, 22, boxWidth, 72, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    setFittedFont(message, boxWidth - 46, 32, 20);
    ctx.fillText(message, GAME_WIDTH / 2, 58);
    ctx.restore();
}

function setFittedFont(text, maxWidth, startSize, minSize) {
    let size = startSize;
    ctx.font = `bold ${size}px Arial`;

    while (ctx.measureText(text).width > maxWidth && size > minSize) {
        size -= 1;
        ctx.font = `bold ${size}px Arial`;
    }
}

function roundRect(context, x, y, width, height, radius) {
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
}

function drawStartScreen() {
    drawBackground();
    drawBucket();

    ctx.save();
    ctx.fillStyle = 'rgba(20, 53, 72, 0.9)';
    ctx.beginPath();
    roundRect(ctx, GAME_WIDTH / 2 - 360, 150, 720, 260, 20);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 42px Arial';
    ctx.fillText('The Big Drop of Bouncy Balls', GAME_WIDTH / 2, 210);
    ctx.font = '28px Arial';
    ctx.fillText('Catch the bouncy balls in your bucket.', GAME_WIDTH / 2, 270);
    ctx.fillText('Rainbow = bonus. Blue = slow motion. Spiky = trouble.', GAME_WIDTH / 2, 320);
    ctx.font = 'bold 30px Arial';
    ctx.fillText('Press Start Game!', GAME_WIDTH / 2, 375);
    ctx.restore();
}

function drawGame() {
    drawBackground();
    balls.forEach(drawBall);
    drawBucket();
    drawSparkles();
    drawMessage();
}

function gameLoop() {
    if (!gameStarted) {
        drawStartScreen();
        requestAnimationFrame(gameLoop);
        return;
    }

    if (!gameOver) {
        updateBucket();
        updateBalls();
    }

    updateSparkles();

    if (messageTimer > 0) {
        messageTimer--;
    }

    drawGame();
    requestAnimationFrame(gameLoop);
}

function setPointerTarget(event) {
    const rect = canvas.getBoundingClientRect();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    bucket.targetX = ((clientX - rect.left) / rect.width) * GAME_WIDTH;
}

window.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        keys.left = true;
        event.preventDefault();
    }
    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        keys.right = true;
        event.preventDefault();
    }
    if (event.key === ' ' || event.key === 'Enter') {
        if (!gameStarted || gameOver) {
            startGame();
        }
        event.preventDefault();
    }
});

window.addEventListener('keyup', event => {
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        keys.left = false;
    }
    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        keys.right = false;
    }
});

canvas.addEventListener('mousemove', setPointerTarget);
canvas.addEventListener('touchstart', event => {
    setPointerTarget(event);
    event.preventDefault();
}, { passive: false });
canvas.addEventListener('touchmove', event => {
    setPointerTarget(event);
    event.preventDefault();
}, { passive: false });

updateScore();
gameLoop();
