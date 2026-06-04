// James and Daddy's Flip Park - Bouncing Trampoline Park Game (also called Flip and Flan)

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game settings
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
const GRAVITY = 0.5;
const BOUNCE_DAMPING = 0.85; // Slight energy loss on bounce
const TRAMPOLINE_BOUNCE = 1.8; // Extra bounce from trampolines

// Game state
let gameStarted = false;
let gameOver = false;
let currentPlayer = 'james'; // 'james' or 'daddy'
let jamesScore = 0;
let daddyScore = 0;
let jamesFlips = 0;
let daddyFlips = 0;
let keys = { left: false, right: false, space: false };

// Players - James and Daddy
const james = {
    name: 'James',
    emoji: '👤', // Person emoji showing body with legs and arms
    color: '#FFFF00', // Yellow
    bgColor: '#0000FF', // Blue
    x: GAME_WIDTH / 2 - 60,
    y: 100,
    vx: 0,
    vy: 0,
    radius: 25,
    active: true,
    onTrampoline: false,
    flipCount: 0,
    lastFlipY: 0
};

const daddy = {
    name: 'Daddy',
    emoji: '👤', // Person emoji showing body with legs and arms
    color: '#00FF00', // Green
    bgColor: '#FF0000', // Red
    x: GAME_WIDTH / 2 + 60,
    y: 100,
    vx: 0,
    vy: 0,
    radius: 30,
    active: false,
    onTrampoline: false,
    flipCount: 0,
    lastFlipY: 0
};

// Get current active player
function getCurrentPlayer() {
    return currentPlayer === 'james' ? james : daddy;
}

// Floor trampolines - long rainbow trampolines at the bottom
const floorTrampolines = [
    { x: GAME_WIDTH / 6, y: GAME_HEIGHT - 30, width: GAME_WIDTH / 3, height: 20, color: '#FF0000', bounce: TRAMPOLINE_BOUNCE * 0.9 },
    { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 30, width: GAME_WIDTH / 3, height: 20, color: '#FF7F00', bounce: TRAMPOLINE_BOUNCE * 0.9 },
    { x: GAME_WIDTH * 5 / 6, y: GAME_HEIGHT - 30, width: GAME_WIDTH / 3, height: 20, color: '#FFFF00', bounce: TRAMPOLINE_BOUNCE * 0.9 },
    { x: GAME_WIDTH / 4, y: GAME_HEIGHT - 30, width: GAME_WIDTH / 3, height: 20, color: '#00FF00', bounce: TRAMPOLINE_BOUNCE * 0.9 },
    { x: GAME_WIDTH * 3 / 4, y: GAME_HEIGHT - 30, width: GAME_WIDTH / 3, height: 20, color: '#0000FF', bounce: TRAMPOLINE_BOUNCE * 0.9 },
    { x: GAME_WIDTH / 3, y: GAME_HEIGHT - 30, width: GAME_WIDTH / 3, height: 20, color: '#4B0082', bounce: TRAMPOLINE_BOUNCE * 0.9 },
    { x: GAME_WIDTH * 2 / 3, y: GAME_HEIGHT - 30, width: GAME_WIDTH / 3, height: 20, color: '#9400D3', bounce: TRAMPOLINE_BOUNCE * 0.9 }
];

// Trampolines - different sizes and positions (floating ones)
const trampolines = [
    { x: 150, y: GAME_HEIGHT - 150, width: 120, height: 20, color: '#FF6B9D', bounce: TRAMPOLINE_BOUNCE },
    { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 200, width: 150, height: 20, color: '#4ECDC4', bounce: TRAMPOLINE_BOUNCE * 1.2 },
    { x: GAME_WIDTH - 150, y: GAME_HEIGHT - 150, width: 120, height: 20, color: '#FFE66D', bounce: TRAMPOLINE_BOUNCE },
    { x: 200, y: GAME_HEIGHT - 300, width: 100, height: 20, color: '#95E1D3', bounce: TRAMPOLINE_BOUNCE },
    { x: GAME_WIDTH - 200, y: GAME_HEIGHT - 300, width: 100, height: 20, color: '#F38181', bounce: TRAMPOLINE_BOUNCE },
    { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 400, width: 180, height: 20, color: '#AA96DA', bounce: TRAMPOLINE_BOUNCE * 1.3 },
    { x: 100, y: GAME_HEIGHT - 500, width: 80, height: 20, color: '#FCBAD3', bounce: TRAMPOLINE_BOUNCE },
    { x: GAME_WIDTH - 100, y: GAME_HEIGHT - 500, width: 80, height: 20, color: '#FFD93D', bounce: TRAMPOLINE_BOUNCE }
];

// Building structure
const building = {
    x: GAME_WIDTH - 200,
    y: GAME_HEIGHT - 250,
    width: 200,
    height: 250,
    color: '#8B7355'
};

// Finish line - yellow and blue
const finishLine = {
    y: 50,
    width: GAME_WIDTH,
    height: 10,
    crossed: false,
    winner: null
};

// Collectibles - stars to collect while bouncing
let stars = [];

// Particle effects for bounces
let particles = [];

// Initialize stars
function initStars() {
    stars = [];
    // Add stars floating around
    for (let i = 0; i < 15; i++) {
        stars.push({
            x: Math.random() * GAME_WIDTH,
            y: Math.random() * (GAME_HEIGHT - 200) + 100,
            collected: false,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: 0.02 + Math.random() * 0.03
        });
    }
}

// Create particle effect
function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 30,
            color: color || '#FFD700',
            size: 3 + Math.random() * 4
        });
    }
}

// Update particles
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // Gravity
        p.life--;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Draw particles
function drawParticles() {
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

// Check if player is on a trampoline
function checkTrampolineCollision(player) {
    // Check floor trampolines first
    for (let tramp of floorTrampolines) {
        if (player.x + player.radius > tramp.x - tramp.width / 2 &&
            player.x - player.radius < tramp.x + tramp.width / 2 &&
            player.y + player.radius > tramp.y - tramp.height / 2 &&
            player.y + player.radius < tramp.y + tramp.height / 2 + 10 &&
            player.vy >= 0) {
            
            // Player is on trampoline
            player.y = tramp.y - tramp.height / 2 - player.radius;
            player.vy = -Math.abs(player.vy) * tramp.bounce;
            
            // Add horizontal boost if moving
            if (keys.left) {
                player.vx -= 0.5;
            }
            if (keys.right) {
                player.vx += 0.5;
            }
            if (keys.space) {
                player.vy *= 1.3; // Extra bounce with space
            }
            
            player.onTrampoline = true;
            createParticles(player.x, player.y, tramp.color);
            
            // Check for flip (going up after being on trampoline)
            if (player.vy < -5) {
                player.flipCount++;
                if (currentPlayer === 'james') {
                    jamesFlips++;
                } else {
                    daddyFlips++;
                }
            }
            
            return true;
        }
    }
    
    // Check floating trampolines
    for (let tramp of trampolines) {
        if (player.x + player.radius > tramp.x - tramp.width / 2 &&
            player.x - player.radius < tramp.x + tramp.width / 2 &&
            player.y + player.radius > tramp.y - tramp.height / 2 &&
            player.y + player.radius < tramp.y + tramp.height / 2 + 10 &&
            player.vy >= 0) {
            
            // Player is on trampoline
            player.y = tramp.y - tramp.height / 2 - player.radius;
            player.vy = -Math.abs(player.vy) * tramp.bounce;
            
            // Add horizontal boost if moving
            if (keys.left) {
                player.vx -= 0.5;
            }
            if (keys.right) {
                player.vx += 0.5;
            }
            if (keys.space) {
                player.vy *= 1.3; // Extra bounce with space
            }
            
            player.onTrampoline = true;
            createParticles(player.x, player.y, tramp.color);
            
            // Check for flip (going up after being on trampoline)
            if (player.vy < -5) {
                player.flipCount++;
                if (currentPlayer === 'james') {
                    jamesFlips++;
                } else {
                    daddyFlips++;
                }
            }
            
            return true;
        }
    }
    player.onTrampoline = false;
    return false;
}

// Update player physics
function updatePlayer() {
    if (gameOver) return;
    
    const player = getCurrentPlayer();
    if (!player.active) return;
    
    // Apply gravity
    player.vy += GRAVITY;
    
    // Apply horizontal movement
    if (keys.left) {
        player.vx -= 0.3;
    }
    if (keys.right) {
        player.vx += 0.3;
    }
    
    // Air control (less effective in air)
    if (!player.onTrampoline) {
        if (keys.left) {
            player.vx -= 0.15;
        }
        if (keys.right) {
            player.vx += 0.15;
        }
    }
    
    // Apply velocity
    player.x += player.vx;
    player.y += player.vy;
    
    // Check trampoline collision
    checkTrampolineCollision(player);
    
    // Bounce off walls
    if (player.x - player.radius < 0) {
        player.x = player.radius;
        player.vx *= -0.6;
        createParticles(player.x, player.y, '#FFD700');
    }
    if (player.x + player.radius > GAME_WIDTH) {
        player.x = GAME_WIDTH - player.radius;
        player.vx *= -0.6;
        createParticles(player.x, player.y, '#FFD700');
    }
    if (player.y - player.radius < 0) {
        player.y = player.radius;
        player.vy *= -0.6;
        createParticles(player.x, player.y, '#FFD700');
    }
    
    // Floor collision - now handled by floor trampolines, but keep safety check
    if (player.y + player.radius > GAME_HEIGHT - 10) {
        player.y = GAME_HEIGHT - 10 - player.radius;
        if (Math.abs(player.vy) > 3) {
            player.vy *= -0.4; // Small bounce
            createParticles(player.x, player.y, '#888');
        } else {
            player.vy = 0;
            // Switch player if stopped
            if (Math.abs(player.vx) < 0.5 && Math.abs(player.vy) < 0.5) {
                switchPlayer(`${player.name} landed safely!`);
            }
        }
    }
    
    // Building collision
    if (player.x + player.radius > building.x - building.width / 2 &&
        player.x - player.radius < building.x + building.width / 2 &&
        player.y + player.radius > building.y - building.height / 2 &&
        player.y - player.radius < building.y + building.height / 2) {
        // Bounce off building
        const dx = player.x - building.x;
        const dy = player.y - building.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            player.vx += dx / dist * 0.5;
            player.vy += dy / dist * 0.5;
        }
    }
    
    // Check finish line
    if (!finishLine.crossed && player.y - player.radius < finishLine.y + finishLine.height) {
        finishLine.crossed = true;
        finishLine.winner = player.name;
        gameOver = true;
        createParticles(player.x, finishLine.y, '#FFFF00');
    }
    
    // Friction
    player.vx *= 0.98;
    
    // Limit max speed
    const maxSpeed = 12;
    player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx));
    player.vy = Math.max(-maxSpeed * 1.5, Math.min(maxSpeed * 1.5, player.vy));
    
    // Check star collection
    stars.forEach(star => {
        if (!star.collected) {
            const dx = player.x - star.x;
            const dy = player.y - star.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < player.radius + 20) {
                star.collected = true;
                createParticles(star.x, star.y, '#FFD700');
                if (currentPlayer === 'james') {
                    jamesScore += 10;
                } else {
                    daddyScore += 10;
                }
                updateScore();
            }
        }
    });
    
    // Spawn new stars occasionally
    if (Math.random() < 0.005 && stars.filter(s => !s.collected).length < 10) {
        stars.push({
            x: Math.random() * GAME_WIDTH,
            y: Math.random() * (GAME_HEIGHT - 200) + 100,
            collected: false,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: 0.02 + Math.random() * 0.03
        });
    }
}

// Switch to next player
function switchPlayer(reason) {
    const current = getCurrentPlayer();
    current.active = false;
    current.vx = 0;
    current.vy = 0;
    
    if (currentPlayer === 'james') {
        currentPlayer = 'daddy';
        daddy.active = true;
        daddy.x = GAME_WIDTH / 2 + 60;
        daddy.y = 100;
        daddy.vx = 0;
        daddy.vy = 0;
        daddy.flipCount = 0;
    } else {
        currentPlayer = 'james';
        james.active = true;
        james.x = GAME_WIDTH / 2 - 60;
        james.y = 100;
        james.vx = 0;
        james.vy = 0;
        james.flipCount = 0;
    }
    
    // Reset all stars
    stars.forEach(s => s.collected = false);
    showSwitchMessage(reason);
}

// Switch message
let switchMessage = '';
let switchMessageTimer = 0;

function showSwitchMessage(reason) {
    switchMessage = reason;
    switchMessageTimer = 120;
}

// Draw background
function drawBackground() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.7, '#E0F6FF');
    gradient.addColorStop(1, '#98D8C8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw finish line (yellow and blue)
    ctx.save();
    // Yellow stripe
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(0, finishLine.y, finishLine.width, finishLine.height / 2);
    // Blue stripe
    ctx.fillStyle = '#0000FF';
    ctx.fillRect(0, finishLine.y + finishLine.height / 2, finishLine.width, finishLine.height / 2);
    // Finish line border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, finishLine.y, finishLine.width, finishLine.height);
    ctx.restore();
    
    // Draw building
    ctx.save();
    ctx.fillStyle = building.color;
    ctx.fillRect(building.x - building.width / 2, building.y - building.height / 2, building.width, building.height);
    
    // Building windows
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 6; j++) {
            ctx.fillRect(
                building.x - building.width / 2 + 20 + i * 35,
                building.y - building.height / 2 + 20 + j * 35,
                25, 25
            );
        }
    }
    
    // Building roof
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.moveTo(building.x - building.width / 2 - 10, building.y - building.height / 2);
    ctx.lineTo(building.x, building.y - building.height / 2 - 20);
    ctx.lineTo(building.x + building.width / 2 + 10, building.y - building.height / 2);
    ctx.closePath();
    ctx.fill();
    
    // Building door
    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(building.x - 25, building.y + building.height / 2 - 60, 50, 60);
    ctx.restore();
}

// Draw trampolines
function drawTrampolines() {
    // Draw floor trampolines (rainbow)
    floorTrampolines.forEach(tramp => {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(tramp.x - tramp.width / 2 + 3, tramp.y + tramp.height / 2 + 3, tramp.width, 8);
        
        // Trampoline body
        ctx.fillStyle = tramp.color;
        ctx.fillRect(tramp.x - tramp.width / 2, tramp.y - tramp.height / 2, tramp.width, tramp.height);
        
        // Trampoline border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.strokeRect(tramp.x - tramp.width / 2, tramp.y - tramp.height / 2, tramp.width, tramp.height);
        
        // Trampoline lines (springs)
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const x = tramp.x - tramp.width / 2 + (i + 1) * (tramp.width / 6);
            ctx.beginPath();
            ctx.moveTo(x, tramp.y - tramp.height / 2);
            ctx.lineTo(x, tramp.y + tramp.height / 2);
            ctx.stroke();
        }
    });
    
    // Draw floating trampolines
    trampolines.forEach(tramp => {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(tramp.x - tramp.width / 2 + 3, tramp.y + tramp.height / 2 + 3, tramp.width, 8);
        
        // Trampoline body
        ctx.fillStyle = tramp.color;
        ctx.fillRect(tramp.x - tramp.width / 2, tramp.y - tramp.height / 2, tramp.width, tramp.height);
        
        // Trampoline border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.strokeRect(tramp.x - tramp.width / 2, tramp.y - tramp.height / 2, tramp.width, tramp.height);
        
        // Trampoline lines (springs)
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const x = tramp.x - tramp.width / 2 + (i + 1) * (tramp.width / 6);
            ctx.beginPath();
            ctx.moveTo(x, tramp.y - tramp.height / 2);
            ctx.lineTo(x, tramp.y + tramp.height / 2);
            ctx.stroke();
        }
    });
}

// Draw stars
function drawStars() {
    stars.forEach(star => {
        if (!star.collected) {
            ctx.save();
            ctx.translate(star.x, star.y);
            ctx.rotate(star.rotation);
            star.rotation += star.rotationSpeed;
            
            // Glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#FFD700';
            ctx.fillStyle = '#FFD700';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⭐', 0, 0);
            ctx.restore();
        }
    });
}

// Draw players
function drawPlayers() {
    // Draw James - Emoji with yellow and blue circles
    ctx.save();
    ctx.translate(james.x, james.y);
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, james.radius + 5, james.radius * 0.8, james.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Yellow outer circle
    ctx.fillStyle = james.color; // Yellow
    ctx.beginPath();
    ctx.arc(0, 0, james.radius + 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Blue inner circle
    ctx.fillStyle = james.bgColor; // Blue
    ctx.beginPath();
    ctx.arc(0, 0, james.radius - 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Player emoji (shows legs, arms, and head)
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(james.emoji, 0, 0);
    
    // Active indicator
    if (james.active) {
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, james.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    ctx.restore();
    
    // Draw Daddy - Emoji with green circled around red
    ctx.save();
    ctx.translate(daddy.x, daddy.y);
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, daddy.radius + 5, daddy.radius * 0.8, daddy.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Green outer circle
    ctx.fillStyle = daddy.color; // Green
    ctx.beginPath();
    ctx.arc(0, 0, daddy.radius + 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Red inner circle
    ctx.fillStyle = daddy.bgColor; // Red
    ctx.beginPath();
    ctx.arc(0, 0, daddy.radius - 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Player emoji (shows legs, arms, and head)
    ctx.font = '45px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(daddy.emoji, 0, 0);
    
    // Active indicator
    if (daddy.active) {
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, daddy.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    ctx.restore();
    
    // Draw name labels
    ctx.save();
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(james.x - 35, james.y - james.radius - 30, 70, 22);
    ctx.fillStyle = '#fff';
    ctx.fillText('James', james.x, james.y - james.radius - 15);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(daddy.x - 40, daddy.y - daddy.radius - 30, 80, 22);
    ctx.fillStyle = '#fff';
    ctx.fillText('Daddy', daddy.x, daddy.y - daddy.radius - 15);
    ctx.restore();
}

// Draw UI
function drawUI() {
    const current = getCurrentPlayer();
    
    // Score display
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(10, 10, 300, 100);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 300, 100);
    
    ctx.fillStyle = '#333';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${current.name}'s Turn`, 20, 35);
    ctx.font = '16px Arial';
    ctx.fillText(`James: ${jamesScore} pts | ${jamesFlips} flips`, 20, 60);
    ctx.fillText(`Daddy: ${daddyScore} pts | ${daddyFlips} flips`, 20, 85);
    ctx.restore();
    
    // Show switch message
    if (switchMessageTimer > 0 && !gameOver) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, GAME_HEIGHT / 2 - 50, GAME_WIDTH, 100);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(switchMessage, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10);
        ctx.font = '24px Arial';
        ctx.fillText(`Now it's ${getCurrentPlayer().name}'s turn!`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
        ctx.restore();
        switchMessageTimer--;
    }
    
    // Draw finish screen with trophy and restart button
    if (gameOver && finishLine.crossed) {
        ctx.save();
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // Trophy (yellow and blue)
        const trophyX = GAME_WIDTH / 2;
        const trophyY = GAME_HEIGHT / 2 - 80;
        
        // Trophy base (blue)
        ctx.fillStyle = '#0000FF';
        ctx.beginPath();
        ctx.arc(trophyX, trophyY + 60, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Trophy cup (yellow)
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.moveTo(trophyX - 25, trophyY + 30);
        ctx.lineTo(trophyX - 20, trophyY - 20);
        ctx.lineTo(trophyX + 20, trophyY - 20);
        ctx.lineTo(trophyX + 25, trophyY + 30);
        ctx.closePath();
        ctx.fill();
        
        // Trophy handle (blue)
        ctx.strokeStyle = '#0000FF';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(trophyX - 30, trophyY - 10, 15, 0, Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(trophyX + 30, trophyY - 10, 15, 0, Math.PI);
        ctx.stroke();
        
        // Trophy emoji
        ctx.font = '60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏆', trophyX, trophyY);
        
        // Winner text
        ctx.fillStyle = '#FFFF00';
        ctx.font = 'bold 36px Arial';
        ctx.fillText(`${finishLine.winner} Wins!`, GAME_WIDTH / 2, trophyY + 120);
        
        // Final scores
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px Arial';
        ctx.fillText(`James: ${jamesScore} pts (${jamesFlips} flips)`, GAME_WIDTH / 2, trophyY + 160);
        ctx.fillText(`Daddy: ${daddyScore} pts (${daddyFlips} flips)`, GAME_WIDTH / 2, trophyY + 190);
        
        // Restart button (yellow and blue)
        const buttonX = GAME_WIDTH / 2;
        const buttonY = trophyY + 250;
        const buttonWidth = 200;
        const buttonHeight = 60;
        
        // Button background (yellow)
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight);
        
        // Button border (blue)
        ctx.strokeStyle = '#0000FF';
        ctx.lineWidth = 4;
        ctx.strokeRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight);
        
        // Button text (blue)
        ctx.fillStyle = '#0000FF';
        ctx.font = 'bold 28px Arial';
        ctx.fillText('Restart', buttonX, buttonY + 8);
        
        // Store button position for click detection
        window.restartButton = {
            x: buttonX - buttonWidth / 2,
            y: buttonY - buttonHeight / 2,
            width: buttonWidth,
            height: buttonHeight
        };
        
        ctx.restore();
    }
}

// Update score display
function updateScore() {
    const current = getCurrentPlayer();
    document.getElementById('score').textContent = 
        `${current.name}'s Turn | James: ${jamesScore} pts (${jamesFlips} flips) | Daddy: ${daddyScore} pts (${daddyFlips} flips)`;
}

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    drawBackground();
    drawTrampolines();
    // Always draw stars (even when game is over)
    drawStars();
    
    if (!gameOver && gameStarted) {
        updatePlayer();
        updateParticles();
    }
    
    drawParticles();
    drawPlayers();
    drawUI();
    
    requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    gameStarted = true;
    gameOver = false;
    currentPlayer = 'james';
    jamesScore = 0;
    daddyScore = 0;
    jamesFlips = 0;
    daddyFlips = 0;
    james.x = GAME_WIDTH / 2 - 60;
    james.y = 100;
    james.vx = 0;
    james.vy = 0;
    james.active = true;
    daddy.x = GAME_WIDTH / 2 + 60;
    daddy.y = 100;
    daddy.vx = 0;
    daddy.vy = 0;
    daddy.active = false;
    switchMessage = '';
    switchMessageTimer = 0;
    particles = [];
    finishLine.crossed = false;
    finishLine.winner = null;
    initStars();
    updateScore();
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        keys.left = true;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        keys.right = true;
    }
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        keys.space = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        keys.left = false;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        keys.right = false;
    }
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        keys.space = false;
    }
});

// Mouse click handler for restart button
canvas.addEventListener('click', (e) => {
    if (gameOver && window.restartButton) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (x >= window.restartButton.x &&
            x <= window.restartButton.x + window.restartButton.width &&
            y >= window.restartButton.y &&
            y <= window.restartButton.y + window.restartButton.height) {
            startGame();
        }
    }
});

// Initialize game
window.onload = function() {
    canvas.focus();
    canvas.setAttribute('tabindex', '0');
    
    window.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }
    }, { passive: false });
    
    initStars();
    drawBackground();
    drawTrampolines();
    drawStars();
    drawPlayers();
    drawUI();
    gameLoop();
};

// Make startGame available globally
window.startGame = startGame;

