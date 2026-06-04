// Fun Obstacles - Free Driving Game with Roundabout, AI Cars, and Batteries

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game settings
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
const CENTER_X = GAME_WIDTH / 2;
const CENTER_Y = GAME_HEIGHT / 2;

// Player car settings
const CAR_SIZE = 50;
const CAR_SPEED = 5; // Slightly faster for better control

// Game state
let gameStarted = false;
let gameOver = false;
let currentPlayer = 'jason'; // 'jason' or 'james'
let jasonScore = 0;
let jamesScore = 0;
let jasonBattery = 100;
let jamesBattery = 100;
let batteryDrainRate = 0.1; // Battery drains per frame
let obstacles = [];
let batteries = [];
let aiCars = [];
let keys = { left: false, right: false, up: false, down: false, space: false };

// Player cars - Jason (red) and James (yellow)
const jasonCar = {
    name: 'Jason',
    emoji: '🚗', // Red car
    color: '#FF0000', // Bright red
    x: CENTER_X - 50,
    y: CENTER_Y - 100,
    rotation: 0,
    speed: 0,
    active: true
};

const jamesCar = {
    name: 'James',
    emoji: '🚕', // Yellow taxi
    color: '#FFD700', // Gold/yellow
    x: CENTER_X + 50,
    y: CENTER_Y - 100,
    rotation: 0,
    speed: 0,
    active: false
};

// Get current active player car
function getCurrentCar() {
    return currentPlayer === 'jason' ? jasonCar : jamesCar;
}

// Get current battery level
function getCurrentBattery() {
    return currentPlayer === 'jason' ? jasonBattery : jamesBattery;
}

// Set current battery level
function setCurrentBattery(value) {
    if (currentPlayer === 'jason') {
        jasonBattery = value;
    } else {
        jamesBattery = value;
    }
}

// Get current score
function getCurrentScore() {
    return currentPlayer === 'jason' ? jasonScore : jamesScore;
}

// Add to current score
function addToCurrentScore(points) {
    if (currentPlayer === 'jason') {
        jasonScore += points;
    } else {
        jamesScore += points;
    }
}

// Buildings
const buildings = [
    { type: '🏥', name: 'Hospital', x: 200, y: 150, size: 80 },
    { type: '🏫', name: 'School', x: GAME_WIDTH - 200, y: 150, size: 80 },
    { type: '🛝', name: 'Playground', x: 200, y: GAME_HEIGHT - 150, size: 80 },
    { type: '🛒', name: 'Pak N Save', x: GAME_WIDTH - 200, y: GAME_HEIGHT - 150, size: 80 }
];

// Roundabout settings
const ROUNDABOUT_RADIUS = 120;
const ROUNDABOUT_CENTER_X = CENTER_X;
const ROUNDABOUT_CENTER_Y = CENTER_Y;

// Road settings
const ROAD_WIDTH = 100;

// Initialize obstacles - place them on roads
function initObstacles() {
    obstacles = [
        // Top road obstacles
        { type: '🚧', x: CENTER_X - 30, y: 150 },
        { type: '🪨', x: CENTER_X + 30, y: 200 },
        // Bottom road obstacles
        { type: '🛑', x: CENTER_X - 30, y: GAME_HEIGHT - 200 },
        { type: '⚠️', x: CENTER_X + 30, y: GAME_HEIGHT - 150 },
        // Left road obstacles
        { type: '🚧', x: 150, y: CENTER_Y - 30 },
        { type: '🪨', x: 200, y: CENTER_Y + 30 },
        // Right road obstacles
        { type: '🛑', x: GAME_WIDTH - 200, y: CENTER_Y - 30 },
        { type: '⚠️', x: GAME_WIDTH - 150, y: CENTER_Y + 30 },
        // Road to hospital
        { type: '🚧', x: 150, y: 100 },
        // Road to school
        { type: '🪨', x: GAME_WIDTH - 150, y: 100 },
        // Road to playground
        { type: '🛑', x: 150, y: GAME_HEIGHT - 100 },
        // Road to Pak N Save
        { type: '⚠️', x: GAME_WIDTH - 150, y: GAME_HEIGHT - 100 }
    ];
}

// Initialize batteries - place them on roads, away from obstacles
function initBatteries() {
    batteries = [];
    // Add batteries along roads, positioned away from obstacles
    const roadPositions = [
        // Top road - away from obstacles
        { x: CENTER_X - 50, y: 120 },
        { x: CENTER_X + 50, y: 250 },
        // Bottom road - away from obstacles
        { x: CENTER_X - 50, y: GAME_HEIGHT - 250 },
        { x: CENTER_X + 50, y: GAME_HEIGHT - 120 },
        // Left road - away from obstacles
        { x: 120, y: CENTER_Y - 50 },
        { x: 250, y: CENTER_Y + 50 },
        // Right road - away from obstacles
        { x: GAME_WIDTH - 250, y: CENTER_Y - 50 },
        { x: GAME_WIDTH - 120, y: CENTER_Y + 50 }
    ];
    
    roadPositions.forEach(pos => {
        batteries.push({
            x: pos.x,
            y: pos.y,
            collected: false
        });
    });
}

// Initialize AI cars - place them on roads
function initAICars() {
    aiCars = [];
    // Add 3 AI cars on different roads
    const roadPositions = [
        { x: CENTER_X, y: 100, direction: Math.PI / 2 }, // Top road, going down
        { x: CENTER_X, y: GAME_HEIGHT - 100, direction: -Math.PI / 2 }, // Bottom road, going up
        { x: 100, y: CENTER_Y, direction: 0 }, // Left road, going right
        { x: GAME_WIDTH - 100, y: CENTER_Y, direction: Math.PI } // Right road, going left
    ];
    
    for (let i = 0; i < 3; i++) {
        const pos = roadPositions[i % roadPositions.length];
        aiCars.push({
            x: pos.x + (Math.random() - 0.5) * 50,
            y: pos.y + (Math.random() - 0.5) * 50,
            rotation: pos.direction,
            speed: 2.5 + Math.random() * 1.5,
            direction: pos.direction,
            changeDirectionTimer: 0,
            roadFollowing: true
        });
    }
}

// Draw the roundabout
function drawRoundabout() {
    // Roundabout grass center
    ctx.fillStyle = '#2d5016';
    ctx.beginPath();
    ctx.arc(ROUNDABOUT_CENTER_X, ROUNDABOUT_CENTER_Y, ROUNDABOUT_RADIUS - 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Roundabout road
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(ROUNDABOUT_CENTER_X, ROUNDABOUT_CENTER_Y, ROUNDABOUT_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    
    // Roundabout edge
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(ROUNDABOUT_CENTER_X, ROUNDABOUT_CENTER_Y, ROUNDABOUT_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    
    // Roundabout center line
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.setLineDash([15, 15]);
    ctx.beginPath();
    ctx.arc(ROUNDABOUT_CENTER_X, ROUNDABOUT_CENTER_Y, ROUNDABOUT_RADIUS - 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
}

// Draw roads connecting to roundabout and buildings
function drawRoads() {
    // Grass background
    ctx.fillStyle = '#2d5016';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Main roads from roundabout (top, bottom, left, right)
    ctx.fillStyle = '#555';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    
    // Top road (vertical)
    ctx.fillRect(ROUNDABOUT_CENTER_X - ROAD_WIDTH/2, 0, ROAD_WIDTH, ROUNDABOUT_CENTER_Y - ROUNDABOUT_RADIUS);
    ctx.strokeRect(ROUNDABOUT_CENTER_X - ROAD_WIDTH/2, 0, ROAD_WIDTH, ROUNDABOUT_CENTER_Y - ROUNDABOUT_RADIUS);
    
    // Bottom road (vertical)
    ctx.fillRect(ROUNDABOUT_CENTER_X - ROAD_WIDTH/2, ROUNDABOUT_CENTER_Y + ROUNDABOUT_RADIUS, ROAD_WIDTH, GAME_HEIGHT - (ROUNDABOUT_CENTER_Y + ROUNDABOUT_RADIUS));
    ctx.strokeRect(ROUNDABOUT_CENTER_X - ROAD_WIDTH/2, ROUNDABOUT_CENTER_Y + ROUNDABOUT_RADIUS, ROAD_WIDTH, GAME_HEIGHT - (ROUNDABOUT_CENTER_Y + ROUNDABOUT_RADIUS));
    
    // Left road (horizontal)
    ctx.fillRect(0, ROUNDABOUT_CENTER_Y - ROAD_WIDTH/2, ROUNDABOUT_CENTER_X - ROUNDABOUT_RADIUS, ROAD_WIDTH);
    ctx.strokeRect(0, ROUNDABOUT_CENTER_Y - ROAD_WIDTH/2, ROUNDABOUT_CENTER_X - ROUNDABOUT_RADIUS, ROAD_WIDTH);
    
    // Right road (horizontal)
    ctx.fillRect(ROUNDABOUT_CENTER_X + ROUNDABOUT_RADIUS, ROUNDABOUT_CENTER_Y - ROAD_WIDTH/2, GAME_WIDTH - (ROUNDABOUT_CENTER_X + ROUNDABOUT_RADIUS), ROAD_WIDTH);
    ctx.strokeRect(ROUNDABOUT_CENTER_X + ROUNDABOUT_RADIUS, ROUNDABOUT_CENTER_Y - ROAD_WIDTH/2, GAME_WIDTH - (ROUNDABOUT_CENTER_X + ROUNDABOUT_RADIUS), ROAD_WIDTH);
    
    // Roads to Hospital (top-left)
    const hospitalRoadWidth = 80;
    ctx.fillRect(buildings[0].x - hospitalRoadWidth/2, buildings[0].y + buildings[0].size/2, hospitalRoadWidth, ROUNDABOUT_CENTER_Y - buildings[0].y - buildings[0].size/2);
    ctx.strokeRect(buildings[0].x - hospitalRoadWidth/2, buildings[0].y + buildings[0].size/2, hospitalRoadWidth, ROUNDABOUT_CENTER_Y - buildings[0].y - buildings[0].size/2);
    ctx.fillRect(0, buildings[0].y - hospitalRoadWidth/2, buildings[0].x + buildings[0].size/2, hospitalRoadWidth);
    ctx.strokeRect(0, buildings[0].y - hospitalRoadWidth/2, buildings[0].x + buildings[0].size/2, hospitalRoadWidth);
    
    // Roads to School (top-right)
    ctx.fillRect(buildings[1].x - hospitalRoadWidth/2, buildings[1].y + buildings[1].size/2, hospitalRoadWidth, ROUNDABOUT_CENTER_Y - buildings[1].y - buildings[1].size/2);
    ctx.strokeRect(buildings[1].x - hospitalRoadWidth/2, buildings[1].y + buildings[1].size/2, hospitalRoadWidth, ROUNDABOUT_CENTER_Y - buildings[1].y - buildings[1].size/2);
    ctx.fillRect(buildings[1].x - buildings[1].size/2, buildings[1].y - hospitalRoadWidth/2, GAME_WIDTH - (buildings[1].x - buildings[1].size/2), hospitalRoadWidth);
    ctx.strokeRect(buildings[1].x - buildings[1].size/2, buildings[1].y - hospitalRoadWidth/2, GAME_WIDTH - (buildings[1].x - buildings[1].size/2), hospitalRoadWidth);
    
    // Roads to Playground (bottom-left)
    ctx.fillRect(buildings[2].x - hospitalRoadWidth/2, ROUNDABOUT_CENTER_Y + ROUNDABOUT_RADIUS, hospitalRoadWidth, buildings[2].y - buildings[2].size/2 - (ROUNDABOUT_CENTER_Y + ROUNDABOUT_RADIUS));
    ctx.strokeRect(buildings[2].x - hospitalRoadWidth/2, ROUNDABOUT_CENTER_Y + ROUNDABOUT_RADIUS, hospitalRoadWidth, buildings[2].y - buildings[2].size/2 - (ROUNDABOUT_CENTER_Y + ROUNDABOUT_RADIUS));
    ctx.fillRect(0, buildings[2].y - hospitalRoadWidth/2, buildings[2].x + buildings[2].size/2, hospitalRoadWidth);
    ctx.strokeRect(0, buildings[2].y - hospitalRoadWidth/2, buildings[2].x + buildings[2].size/2, hospitalRoadWidth);
    
    // Roads to Pak N Save (bottom-right)
    ctx.fillRect(buildings[3].x - hospitalRoadWidth/2, ROUNDABOUT_CENTER_Y + ROUNDABOUT_RADIUS, hospitalRoadWidth, buildings[3].y - buildings[3].size/2 - (ROUNDABOUT_CENTER_Y + ROUNDABOUT_RADIUS));
    ctx.strokeRect(buildings[3].x - hospitalRoadWidth/2, ROUNDABOUT_CENTER_Y + ROUNDABOUT_RADIUS, hospitalRoadWidth, buildings[3].y - buildings[3].size/2 - (ROUNDABOUT_CENTER_Y + ROUNDABOUT_RADIUS));
    ctx.fillRect(buildings[3].x - buildings[3].size/2, buildings[3].y - hospitalRoadWidth/2, GAME_WIDTH - (buildings[3].x - buildings[3].size/2), hospitalRoadWidth);
    ctx.strokeRect(buildings[3].x - buildings[3].size/2, buildings[3].y - hospitalRoadWidth/2, GAME_WIDTH - (buildings[3].x - buildings[3].size/2), hospitalRoadWidth);
    
    // Center lines on all roads
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);
    
    // Top road center line
    ctx.beginPath();
    ctx.moveTo(ROUNDABOUT_CENTER_X, 0);
    ctx.lineTo(ROUNDABOUT_CENTER_X, ROUNDABOUT_CENTER_Y - ROUNDABOUT_RADIUS);
    ctx.stroke();
    
    // Bottom road center line
    ctx.beginPath();
    ctx.moveTo(ROUNDABOUT_CENTER_X, ROUNDABOUT_CENTER_Y + ROUNDABOUT_RADIUS);
    ctx.lineTo(ROUNDABOUT_CENTER_X, GAME_HEIGHT);
    ctx.stroke();
    
    // Left road center line
    ctx.beginPath();
    ctx.moveTo(0, ROUNDABOUT_CENTER_Y);
    ctx.lineTo(ROUNDABOUT_CENTER_X - ROUNDABOUT_RADIUS, ROUNDABOUT_CENTER_Y);
    ctx.stroke();
    
    // Right road center line
    ctx.beginPath();
    ctx.moveTo(ROUNDABOUT_CENTER_X + ROUNDABOUT_RADIUS, ROUNDABOUT_CENTER_Y);
    ctx.lineTo(GAME_WIDTH, ROUNDABOUT_CENTER_Y);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Draw roundabout
    drawRoundabout();
}

// Draw buildings
function drawBuildings() {
    buildings.forEach(building => {
        ctx.save();
        ctx.font = building.size + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(building.type, building.x, building.y);
        
        // Building label
        ctx.font = '14px Arial';
        ctx.fillStyle = '#000';
        ctx.fillText(building.name, building.x, building.y + building.size/2 + 15);
        ctx.restore();
    });
}

// Draw obstacles
function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.save();
        
        // Draw warning circle behind obstacle
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(obstacle.x, obstacle.y, 35, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw obstacle emoji
        ctx.font = '45px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(obstacle.type, obstacle.x, obstacle.y);
        
        // Draw outline for visibility
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(obstacle.x, obstacle.y, 35, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    });
}

// Draw batteries (koala bears) - NO CIRCLES, just the emoji
function drawBatteries() {
    batteries.forEach(battery => {
        if (!battery.collected) {
            ctx.save();
            // NO circles, NO backgrounds, just the koala emoji
            ctx.font = '50px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Just draw the koala bear emoji - nothing else
            ctx.fillText('🐨', battery.x, battery.y);
            ctx.restore();
        }
    });
}

// Draw AI cars
function drawAICars() {
    aiCars.forEach(car => {
        ctx.save();
        ctx.font = '45px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.translate(car.x, car.y);
        ctx.rotate(car.rotation);
        ctx.fillText('🚙', 0, 0);
        ctx.restore();
    });
}

// Draw player cars
function drawPlayerCars() {
    const carSize = 50;
    
    // Draw Jason's car (red) - always visible
    ctx.save();
    ctx.translate(jasonCar.x, jasonCar.y);
    ctx.rotate(jasonCar.rotation);
    
    // Draw red background rectangle for visibility
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(-carSize/2 - 5, -carSize/2 - 5, carSize + 10, carSize + 10);
    
    // Draw red circle outline
    ctx.strokeStyle = '#AA0000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, carSize/2 + 8, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw car emoji
    ctx.font = '60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚗', 0, 0);
    ctx.restore();
    
    // Draw James's car (yellow) - always visible
    ctx.save();
    ctx.translate(jamesCar.x, jamesCar.y);
    ctx.rotate(jamesCar.rotation);
    
    // Draw yellow background rectangle for visibility
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-carSize/2 - 5, -carSize/2 - 5, carSize + 10, carSize + 10);
    
    // Draw yellow circle outline
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, carSize/2 + 8, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw car emoji
    ctx.font = '60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚕', 0, 0);
    ctx.restore();
    
    // Draw name labels with background for visibility
    ctx.save();
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    
    // Jason's label
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(jasonCar.x - 40, jasonCar.y - 55, 80, 25);
    ctx.fillStyle = '#fff';
    ctx.fillText('Jason', jasonCar.x, jasonCar.y - 40);
    
    // James's label
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(jamesCar.x - 40, jamesCar.y - 55, 80, 25);
    ctx.fillStyle = '#fff';
    ctx.fillText('James', jamesCar.x, jamesCar.y - 40);
    ctx.restore();
    
    // Draw active indicator (highlight for current player)
    const activeCar = getCurrentCar();
    ctx.save();
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 5;
    ctx.setLineDash([10, 5]);
    if (activeCar === jasonCar) {
        ctx.beginPath();
        ctx.arc(jasonCar.x, jasonCar.y, carSize/2 + 15, 0, Math.PI * 2);
        ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.arc(jamesCar.x, jamesCar.y, carSize/2 + 15, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
}

// Player switch message variables
let switchMessage = '';
let switchMessageTimer = 0;

// Show player switch message
function showPlayerSwitchMessage(reason) {
    switchMessage = reason;
    switchMessageTimer = 120; // Show for 2 seconds at 60fps
}

// Switch to next player
function switchPlayer(reason) {
    if (currentPlayer === 'jason') {
        jasonCar.active = false;
        jamesCar.active = true;
        currentPlayer = 'james';
        jamesBattery = 100; // Reset battery for new player
        jamesCar.x = CENTER_X + 50;
        jamesCar.y = CENTER_Y - 100;
        jamesCar.rotation = 0;
    } else {
        jamesCar.active = false;
        jasonCar.active = true;
        currentPlayer = 'jason';
        jasonBattery = 100; // Reset battery for new player
        jasonCar.x = CENTER_X - 50;
        jasonCar.y = CENTER_Y - 100;
        jasonCar.rotation = 0;
    }
    // Reset all batteries on road
    batteries.forEach(b => b.collected = false);
    // Show message
    showPlayerSwitchMessage(reason);
}

// Update AI cars - make them follow roads better
function updateAICars() {
    aiCars.forEach(car => {
        car.changeDirectionTimer++;
        
        // Check if car is on a road, if not, try to get back on
        const onRoad = isOnRoad(car.x, car.y);
        
        if (!onRoad) {
            // Try to get back to nearest road
            const nearestRoad = findNearestRoad(car.x, car.y);
            const dx = nearestRoad.x - car.x;
            const dy = nearestRoad.y - car.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 10) {
                car.direction = Math.atan2(dy, dx);
            }
        } else {
            // Change direction occasionally when on road
            if (car.changeDirectionTimer > 180 + Math.random() * 120) {
                // Choose a new road direction
                const directions = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
                car.direction = directions[Math.floor(Math.random() * directions.length)];
                car.changeDirectionTimer = 0;
            }
        }
        
        // Move car
        const newX = car.x + Math.cos(car.direction) * car.speed;
        const newY = car.y + Math.sin(car.direction) * car.speed;
        
        // Check collision with obstacles before moving
        if (!checkAICarCollision(newX, newY, car)) {
            car.x = newX;
            car.y = newY;
        } else {
            // Bounce off obstacle
            car.direction += Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 4;
        }
        
        car.rotation = car.direction;
        
        // Keep in bounds
        car.x = Math.max(CAR_SIZE/2, Math.min(GAME_WIDTH - CAR_SIZE/2, car.x));
        car.y = Math.max(CAR_SIZE/2, Math.min(GAME_HEIGHT - CAR_SIZE/2, car.y));
    });
}

// Check if position is on a road
function isOnRoad(x, y) {
    const roadMargin = ROAD_WIDTH / 2 + 20;
    
    // Check main roads
    if (Math.abs(x - CENTER_X) < roadMargin && (y < CENTER_Y - ROUNDABOUT_RADIUS || y > CENTER_Y + ROUNDABOUT_RADIUS)) {
        return true; // On vertical road
    }
    if (Math.abs(y - CENTER_Y) < roadMargin && (x < CENTER_X - ROUNDABOUT_RADIUS || x > CENTER_X + ROUNDABOUT_RADIUS)) {
        return true; // On horizontal road
    }
    
    // Check roundabout
    const distFromCenter = Math.sqrt((x - CENTER_X) ** 2 + (y - CENTER_Y) ** 2);
    if (distFromCenter > ROUNDABOUT_RADIUS - 30 && distFromCenter < ROUNDABOUT_RADIUS + 30) {
        return true; // On roundabout
    }
    
    return false;
}

// Find nearest road point
function findNearestRoad(x, y) {
    // Find nearest point on main roads
    let nearestX = x;
    let nearestY = y;
    let minDist = Infinity;
    
    // Check vertical road
    const distToVertical = Math.abs(x - CENTER_X);
    if (distToVertical < minDist) {
        minDist = distToVertical;
        nearestX = CENTER_X;
        nearestY = Math.max(0, Math.min(GAME_HEIGHT, y));
    }
    
    // Check horizontal road
    const distToHorizontal = Math.abs(y - CENTER_Y);
    if (distToHorizontal < minDist) {
        minDist = distToHorizontal;
        nearestX = Math.max(0, Math.min(GAME_WIDTH, x));
        nearestY = CENTER_Y;
    }
    
    return { x: nearestX, y: nearestY };
}

// Check AI car collision with obstacles
function checkAICarCollision(x, y, aiCar) {
    const carRadius = CAR_SIZE / 2;
    
    // Check obstacles
    for (let obstacle of obstacles) {
        const obstacleRadius = 30;
        const dx = x - obstacle.x;
        const dy = y - obstacle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < (carRadius + obstacleRadius)) {
            return true;
        }
    }
    
    // Check buildings
    for (let building of buildings) {
        const buildingRadius = building.size / 2;
        const dx = x - building.x;
        const dy = y - building.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < (carRadius + buildingRadius)) {
            return true;
        }
    }
    
    return false;
}

// Update batteries
function updateBatteries() {
    const currentCar = getCurrentCar();
    
    // Check if current player collects batteries (koala bears)
    batteries.forEach(battery => {
        if (!battery.collected) {
            const dx = currentCar.x - battery.x;
            const dy = currentCar.y - battery.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Easy collection - just get close to the koala bear
            if (distance < 80) {
                battery.collected = true;
                const newBattery = Math.min(100, getCurrentBattery() + 30); // Add 30% battery
                setCurrentBattery(newBattery);
                addToCurrentScore(10);
                updateScore();
            }
        }
    });
    
    // Spawn new batteries on roads if needed
    const activeBatteries = batteries.filter(b => !b.collected).length;
    if (activeBatteries < 3 && Math.random() < 0.01) {
        const roadPositions = [
            { x: CENTER_X + (Math.random() - 0.5) * 40, y: 100 + Math.random() * 200 },
            { x: CENTER_X + (Math.random() - 0.5) * 40, y: GAME_HEIGHT - 200 + Math.random() * 200 },
            { x: 100 + Math.random() * 200, y: CENTER_Y + (Math.random() - 0.5) * 40 },
            { x: GAME_WIDTH - 200 + Math.random() * 200, y: CENTER_Y + (Math.random() - 0.5) * 40 }
        ];
        const pos = roadPositions[Math.floor(Math.random() * roadPositions.length)];
        batteries.push({
            x: pos.x,
            y: pos.y,
            collected: false
        });
    }
}

// Update player position - free movement
function updatePlayer() {
    if (gameOver) return;
    
    const currentCar = getCurrentCar();
    if (!currentCar.active) return;
    
    // Drain battery
    let battery = getCurrentBattery();
    battery -= batteryDrainRate;
    setCurrentBattery(battery);
    
    if (battery <= 0) {
        // Battery drained - switch player
        switchPlayer(`${currentCar.name}'s battery drained!`);
        return;
    }
    
    // Determine movement direction based on keys
    let moveX = 0;
    let moveY = 0;
    
    // All arrow keys and space make the car go
    if (keys.up || keys.space) {
        moveY = -CAR_SPEED;
        currentCar.rotation = -Math.PI / 2; // Point up
    }
    if (keys.down) {
        moveY = CAR_SPEED;
        currentCar.rotation = Math.PI / 2; // Point down
    }
    if (keys.left) {
        moveX = -CAR_SPEED;
        currentCar.rotation = Math.PI; // Point left
    }
    if (keys.right) {
        moveX = CAR_SPEED;
        currentCar.rotation = 0; // Point right
    }
    
    // Handle diagonal movement
    if (keys.up && keys.left) {
        currentCar.rotation = -Math.PI * 3 / 4; // Up-left
    }
    if (keys.up && keys.right) {
        currentCar.rotation = -Math.PI / 4; // Up-right
    }
    if (keys.down && keys.left) {
        currentCar.rotation = Math.PI * 3 / 4; // Down-left
    }
    if (keys.down && keys.right) {
        currentCar.rotation = Math.PI / 4; // Down-right
    }
    
    // Calculate new position
    const newX = currentCar.x + moveX;
    const newY = currentCar.y + moveY;
    
    // Check if new position would collide with obstacles
    if (checkCollisionAtPosition(newX, newY)) {
        // Hit an obstacle - switch player!
        switchPlayer(`${currentCar.name} crashed into an obstacle!`);
        return;
    }
    
    // Check collision with buildings
    for (let building of buildings) {
        const buildingRadius = building.size / 2;
        const dx = newX - building.x;
        const dy = newY - building.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < (CAR_SIZE/2 + buildingRadius)) {
            // Hit building - switch player!
            switchPlayer(`${currentCar.name} crashed into ${building.name}!`);
            return;
        }
    }
    
    // Check collision with AI cars
    for (let aiCar of aiCars) {
        const dx = newX - aiCar.x;
        const dy = newY - aiCar.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < CAR_SIZE) {
            // Hit AI car - switch player!
            switchPlayer(`${currentCar.name} crashed into another car!`);
            return;
        }
    }
    
    // Check collision with other player car
    const otherCar = currentCar === jasonCar ? jamesCar : jasonCar;
    const dx = newX - otherCar.x;
    const dy = newY - otherCar.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < CAR_SIZE) {
        // Hit other player's car - switch player!
        switchPlayer(`${currentCar.name} crashed into ${otherCar.name}'s car!`);
        return;
    }
    
    // Only update position if no collision
    currentCar.x = newX;
    currentCar.y = newY;
    
    // Keep car within bounds
    currentCar.x = Math.max(CAR_SIZE/2, Math.min(GAME_WIDTH - CAR_SIZE/2, currentCar.x));
    currentCar.y = Math.max(CAR_SIZE/2, Math.min(GAME_HEIGHT - CAR_SIZE/2, currentCar.y));
}

// Check if there would be a collision at a given position
function checkCollisionAtPosition(x, y) {
    const carRadius = CAR_SIZE / 2;
    
    // Check obstacles
    for (let obstacle of obstacles) {
        const obstacleRadius = 30;
        const dx = x - obstacle.x;
        const dy = y - obstacle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (carRadius + obstacleRadius)) {
            return true; // Would collide
        }
    }
    
    return false; // No collision
}

// Update score display
function updateScore() {
    const currentCar = getCurrentCar();
    const battery = getCurrentBattery();
    document.getElementById('score').textContent = `${currentCar.name}'s Turn | Jason: ${jasonScore} | James: ${jamesScore} | Battery: ${Math.max(0, Math.floor(battery))}%`;
}

// Show game over (when both players are done)
function showGameOver() {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80);
    
    ctx.font = '24px Arial';
    ctx.fillText(`Jason's Score: ${jasonScore}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30);
    ctx.fillText(`James's Score: ${jamesScore}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
    
    const winner = jasonScore > jamesScore ? 'Jason' : jamesScore > jasonScore ? 'James' : 'Tie';
    ctx.fillText(`Winner: ${winner}!`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
    ctx.fillText('Press R to restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 90);
    ctx.restore();
}


// Draw battery bars and player info
function drawBatteryBar() {
    const barWidth = 180;
    const barHeight = 18;
    const barX = 10;
    const barY = 10;
    const spacing = 30;
    
    // Current player indicator
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    const currentCar = getCurrentCar();
    ctx.fillText(`${currentCar.name}'s Turn`, barX, barY - 5);
    
    // Jason's battery bar
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY + spacing, barWidth, barHeight);
    const jasonBatteryWidth = (jasonBattery / 100) * barWidth;
    ctx.fillStyle = jasonBattery > 30 ? '#0f0' : '#f00';
    ctx.fillRect(barX, barY + spacing, jasonBatteryWidth, barHeight);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY + spacing, barWidth, barHeight);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText(`Jason: ${Math.max(0, Math.floor(jasonBattery))}% | Score: ${jasonScore}`, barX, barY + spacing - 5);
    
    // James's battery bar
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY + spacing * 2, barWidth, barHeight);
    const jamesBatteryWidth = (jamesBattery / 100) * barWidth;
    ctx.fillStyle = jamesBattery > 30 ? '#0f0' : '#f00';
    ctx.fillRect(barX, barY + spacing * 2, jamesBatteryWidth, barHeight);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(barX, barY + spacing * 2, barWidth, barHeight);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText(`James: ${Math.max(0, Math.floor(jamesBattery))}% | Score: ${jamesScore}`, barX, barY + spacing * 2 - 5);
}

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    drawRoads();
    drawBuildings();
    drawObstacles();
    drawBatteries();
    
    if (!gameOver) {
        updateAICars();
        updateBatteries();
        updatePlayer();
    }
    
    drawAICars();
    drawPlayerCars();
    drawBatteryBar();
    
    // Show switch message
    if (switchMessageTimer > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, GAME_HEIGHT / 2 - 40, GAME_WIDTH, 80);
        ctx.fillStyle = '#fff';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(switchMessage, GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.font = '20px Arial';
        ctx.fillText(`Now it's ${getCurrentCar().name}'s turn!`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 35);
        ctx.restore();
        switchMessageTimer--;
    }
    
    if (gameOver) {
        showGameOver();
    }
    
    requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    gameStarted = true;
    gameOver = false;
    currentPlayer = 'jason';
    jasonScore = 0;
    jamesScore = 0;
    jasonBattery = 100;
    jamesBattery = 100;
    jasonCar.x = CENTER_X - 50;
    jasonCar.y = CENTER_Y - 100;
    jasonCar.rotation = 0;
    jasonCar.active = true;
    jamesCar.x = CENTER_X + 50;
    jamesCar.y = CENTER_Y - 100;
    jamesCar.rotation = 0;
    jamesCar.active = false;
    switchMessage = '';
    switchMessageTimer = 0;
    initObstacles();
    initBatteries();
    initAICars();
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
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        keys.up = true;
    }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        keys.down = true;
    }
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        keys.space = true;
    }
    if ((e.key === 'r' || e.key === 'R') && gameOver) {
        startGame();
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
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        keys.up = false;
    }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        keys.down = false;
    }
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        keys.space = false;
    }
});

// Initialize game
window.onload = function() {
    // Focus canvas to capture keyboard events
    canvas.focus();
    canvas.setAttribute('tabindex', '0');
    
    // Prevent default arrow key scrolling on window
    window.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }
    }, { passive: false });
    
    initObstacles();
    initBatteries();
    initAICars();
    
    // Initialize car positions
    jasonCar.x = CENTER_X - 50;
    jasonCar.y = CENTER_Y - 100;
    jamesCar.x = CENTER_X + 50;
    jamesCar.y = CENTER_Y - 100;
    
    drawRoads();
    drawBuildings();
    drawObstacles();
    drawBatteries();
    drawAICars();
    drawPlayerCars();
    drawBatteryBar();
    gameLoop();
};

// Make startGame available globally
window.startGame = startGame;
