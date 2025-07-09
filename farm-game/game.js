// Farm Adventure Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

// Game state
let score = 0;
let carrots = 0;
let potatoes = 0;
let fruits = 0;
let currentVehicle = 'tractor'; // 'tractor' or 'digger'

// Vehicles
let tractor = {
    x: 100,
    y: height / 2,
    width: 40,
    height: 30,
    speed: 3,
    color: '#FF6B35'
};

let digger = {
    x: 200,
    y: height / 2,
    width: 40,
    height: 30,
    speed: 3,
    color: '#8B4513'
};

// Collectibles
let collectibles = [];
const collectibleTypes = [
    { type: 'carrot', emoji: '🥕', color: '#FFA500', points: 10 },
    { type: 'potato', emoji: '🥔', color: '#8B4513', points: 15 },
    { type: 'apple', emoji: '🍎', color: '#FF0000', points: 20 },
    { type: 'orange', emoji: '🍊', color: '#FFA500', points: 25 },
    { type: 'strawberry', emoji: '🍓', color: '#FF69B4', points: 30 }
];

// Controls
let keys = {};

// Setup controls
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    // Switch between vehicles with number keys
    if (e.code === 'Digit1') {
        currentVehicle = 'tractor';
    }
    if (e.code === 'Digit2') {
        currentVehicle = 'digger';
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

function generateCollectibles() {
    collectibles = [];
    for (let i = 0; i < 15; i++) {
        const type = collectibleTypes[Math.floor(Math.random() * collectibleTypes.length)];
        collectibles.push({
            x: Math.random() * (width - 30),
            y: Math.random() * (height - 30),
            width: 30,
            height: 30,
            type: type.type,
            emoji: type.emoji,
            color: type.color,
            points: type.points,
            collected: false
        });
    }
}

function updateVehicles() {
    let vehicle = currentVehicle === 'tractor' ? tractor : digger;
    
    if (keys['ArrowUp'] || keys['KeyW']) {
        vehicle.y = Math.max(0, vehicle.y - vehicle.speed);
    }
    if (keys['ArrowDown'] || keys['KeyS']) {
        vehicle.y = Math.min(height - vehicle.height, vehicle.y + vehicle.speed);
    }
    if (keys['ArrowLeft'] || keys['KeyA']) {
        vehicle.x = Math.max(0, vehicle.x - vehicle.speed);
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        vehicle.x = Math.min(width - vehicle.width, vehicle.x + vehicle.speed);
    }
}

function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function checkCollisions() {
    let vehicle = currentVehicle === 'tractor' ? tractor : digger;
    
    collectibles.forEach(collectible => {
        if (!collectible.collected && isColliding(vehicle, collectible)) {
            collectible.collected = true;
            score += collectible.points;
            
            if (collectible.type === 'carrot') {
                carrots++;
            } else if (collectible.type === 'potato') {
                potatoes++;
            } else {
                fruits++;
            }
            
            updateDisplay();
        }
    });
    
    if (collectibles.every(c => c.collected)) {
        setTimeout(generateCollectibles, 1000);
    }
}

function updateDisplay() {
    document.getElementById('score').textContent = score;
    document.getElementById('carrots').textContent = carrots;
    document.getElementById('potatoes').textContent = potatoes;
    document.getElementById('fruits').textContent = fruits;
}

function drawBackground() {
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = '#228B22';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        ctx.fillRect(x, y, 20, 20);
    }
}

function drawVehicle(vehicle, isActive) {
    // Draw vehicle with different style if active
    if (isActive) {
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 3;
        ctx.strokeRect(vehicle.x - 2, vehicle.y - 2, vehicle.width + 4, vehicle.height + 4);
    }
    
    ctx.fillStyle = vehicle.color;
    ctx.fillRect(vehicle.x, vehicle.y, vehicle.width, vehicle.height);
    
    ctx.fillStyle = '#000';
    
    if (vehicle === digger) {
        // Digger details
        ctx.fillRect(vehicle.x + 5, vehicle.y + 5, 10, 10); // cabin
        ctx.fillRect(vehicle.x + 25, vehicle.y + 10, 10, 5); // arm
        ctx.fillRect(vehicle.x + 35, vehicle.y + 8, 3, 9); // bucket
    } else {
        // Tractor details
        ctx.fillRect(vehicle.x + 5, vehicle.y + 5, 10, 10); // cabin
        ctx.fillRect(vehicle.x + 25, vehicle.y + 15, 10, 5); // back wheel
        ctx.fillRect(vehicle.x + 5, vehicle.y + 15, 10, 5); // front wheel
    }
    
    // Label
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    const label = vehicle === digger ? 'DIGGER' : 'TRACTOR';
    ctx.fillText(label, vehicle.x + vehicle.width / 2, vehicle.y - 5);
}

function drawCollectibles() {
    collectibles.forEach(collectible => {
        if (!collectible.collected) {
            ctx.fillStyle = collectible.color;
            ctx.beginPath();
            ctx.arc(collectible.x + collectible.width / 2, 
                   collectible.y + collectible.height / 2, 
                   collectible.width / 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(collectible.emoji, 
                         collectible.x + collectible.width / 2, 
                         collectible.y + collectible.height / 2 + 7);
        }
    });
}

function drawUI() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 60);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Active: ${currentVehicle.toUpperCase()}`, 20, 30);
    ctx.fillText(`Press 1 for Tractor`, 20, 50);
    ctx.fillText(`Press 2 for Digger`, 20, 70);
}

function render() {
    ctx.clearRect(0, 0, width, height);
    drawBackground();
    drawCollectibles();
    drawVehicle(tractor, currentVehicle === 'tractor');
    drawVehicle(digger, currentVehicle === 'digger');
    drawUI();
}

function gameLoop() {
    updateVehicles();
    checkCollisions();
    render();
    requestAnimationFrame(gameLoop);
}

// Start game
generateCollectibles();
gameLoop(); 