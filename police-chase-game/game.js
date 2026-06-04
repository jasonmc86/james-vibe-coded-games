// James and Daddy's Police Car Chase Game

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game settings
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
const POLICE_CAR_WIDTH = 80;
const POLICE_CAR_HEIGHT = 40;
const POLICE_CAR_Y = GAME_HEIGHT - 60;
const POLICE_CAR_SPEED = 8;
const BAD_GUY_WIDTH = 60;
const BAD_GUY_HEIGHT = 40;
const BAD_GUY_SPEED = 4;
const BAD_GUY_SPAWN_INTERVAL = 1500; // ms
const OBSTACLE_WIDTH = 40;
const OBSTACLE_HEIGHT = 40;
const OBSTACLE_SPEED = 5;
const OBSTACLE_SPAWN_INTERVAL = 2000; // ms
const WIN_SCORE = 15;

// Game state
let policeCarX = GAME_WIDTH / 2 - POLICE_CAR_WIDTH / 2;
let leftPressed = false;
let rightPressed = false;
let badGuys = [];
let obstacles = [];
let score = 0;
let gameOver = false;
let lastBadGuySpawn = 0;
let lastObstacleSpawn = 0;
let gameWon = false;

// Mobile controls
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let tiltX = 0;

// Emergency sequence state
let isCrashSequenceRunning = false;
let hasFire = false;
let crashStartX = 0;
let crashStartY = POLICE_CAR_Y;
let fireTruck = null;
let ambulance = null;
let backupPolice = null;
let stretcherDropped = false;
let flamesAlpha = 1;
let waterAnimationT = 0;
let emergencyStage = 0; // 1: fire truck, 2: extinguish, 3: ambulance reverse+stretcher, 4: backup, 5: ambulance depart, 6: auto restart
let emergencyStageStart = 0;
let patient = null; // injured person
let patientMovingToStretcher = false;
let towTruck = null;
let towRequested = false;
let policeCarOnTow = false;
let emergencySpacePressCount = 0;
let vehiclesReturnRequested = false;
const station = { x: 20 };

function startCrashSequence() {
    isCrashSequenceRunning = true;
    hasFire = true;
    crashStartX = policeCarX;
    crashStartY = POLICE_CAR_Y;
    fireTruck = { x: -120, y: POLICE_CAR_Y - 10, speed: 6, targetX: Math.max(20, policeCarX - 110) };
    // Ambulance will approach near scene, then reverse into exact target
    ambulance = {
        x: GAME_WIDTH + 140,
        y: POLICE_CAR_Y - 50,
        speed: 6,
        targetX: Math.min(GAME_WIDTH - 120, policeCarX + 120),
        reversePhase: false
    };
    backupPolice = { x: GAME_WIDTH + 200, y: POLICE_CAR_Y + 20, speed: 6, targetX: Math.min(GAME_WIDTH - 100, policeCarX + 180) };
    stretcherDropped = false;
    flamesAlpha = 1;
    waterAnimationT = 0;
    emergencyStage = 1;
    emergencyStageStart = Date.now();
    // Spawn injured person next to police car
    patient = {
        x: crashStartX + 20,
        y: crashStartY - 10,
        onStretcher: false
    };
    patientMovingToStretcher = false;
    // Reset tow state
    towTruck = null;
    towRequested = false;
    policeCarOnTow = false;
    emergencySpacePressCount = 0;
    vehiclesReturnRequested = false;
}

function drawFireTruck(v) {
    ctx.save();
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚒', v.x + 24, v.y + 20);
    ctx.restore();
}

function drawAmbulance(v) {
    ctx.save();
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚑', v.x + 24, v.y + 20);
    ctx.restore();
}

function drawBackupPolice(v) {
    ctx.save();
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚔', v.x + 24, v.y + 20);
    ctx.restore();
}

function drawTowTruck(v) {
    ctx.save();
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Use a truck emoji to represent a tow truck
    ctx.fillText('🚚', v.x + 24, v.y + 22);
    // Draw a small ramp using characters
    ctx.font = '24px Arial';
    ctx.fillText('/', v.x - 8, v.y + 36);
    ctx.restore();
}

function attachPoliceCarToTow() {
    if (!towTruck) return;
    policeCarOnTow = true;
}

function drawFlames() {
    if (!hasFire) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, flamesAlpha));
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Flames on the police car
    ctx.fillText('🔥', crashStartX + POLICE_CAR_WIDTH / 2 - 20, crashStartY - 10);
    ctx.fillText('🔥', crashStartX + POLICE_CAR_WIDTH / 2 + 20, crashStartY - 20);
    // Flames on patient if not on stretcher yet
    if (patient && !patient.onStretcher) {
        ctx.fillText('🔥', patient.x, patient.y - 20);
    }
    ctx.restore();
}

function drawWaterSpray() {
    if (emergencyStage !== 2 || !fireTruck) return;
    ctx.save();
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Draw a few droplets from fireTruck towards the police car
    const startX = fireTruck.x + 50;
    const startY = fireTruck.y + 10;
    const endX = crashStartX + POLICE_CAR_WIDTH / 2;
    const endY = crashStartY - 10;
    for (let i = 0; i < 4; i++) {
        const t = (waterAnimationT + i * 0.2) % 1;
        const x = startX + (endX - startX) * t;
        const y = startY + (endY - startY) * t;
        ctx.fillText('💧', x, y);
    }
    ctx.restore();
}

function drawStretcher() {
    if (!stretcherDropped || !ambulance) return;
    ctx.save();
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const bedX = ambulance.x - 10;
    const bedY = ambulance.y + 40;
    ctx.fillText('🛏️', bedX, bedY);
    // Draw patient on bed if loaded
    if (patient && patient.onStretcher) {
        ctx.font = '32px Arial';
        ctx.fillText('👤', bedX, bedY - 8);
    }
    ctx.restore();
}

function drawPatient() {
    if (!patient || patient.onStretcher) return;
    ctx.save();
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👤', patient.x, patient.y);
    ctx.restore();
}

function updateCrashSequence() {
    const now = Date.now();
    if (emergencyStage === 1) {
        // Fire truck arrives
        if (fireTruck.x < fireTruck.targetX) {
            fireTruck.x += fireTruck.speed;
        } else {
            emergencyStage = 2;
            emergencyStageStart = now;
        }
        // Move ambulance and backup slightly onto screen as well
        if (ambulance.x > ambulance.targetX + 140) ambulance.x -= ambulance.speed * 0.7;
        if (backupPolice.x > backupPolice.targetX + 160) backupPolice.x -= backupPolice.speed * 0.5;
    } else if (emergencyStage === 2) {
        // Extinguishing fire
        waterAnimationT += 0.05;
        const elapsed = now - emergencyStageStart;
        flamesAlpha = Math.max(0, 1 - elapsed / 1500);
        if (elapsed > 1600) {
            hasFire = false;
            emergencyStage = 3;
            emergencyStageStart = now;
        }
    } else if (emergencyStage === 3) {
        // Ambulance arrives forward, then reverses into position and drops stretcher
        if (!ambulance.reversePhase) {
            if (ambulance.x > ambulance.targetX + 100) {
                ambulance.x -= ambulance.speed;
            } else {
                ambulance.reversePhase = true; // start reversing
            }
        } else {
            if (ambulance.x > ambulance.targetX) {
                ambulance.x -= ambulance.speed * 0.7; // reverse slowly
            } else if (!stretcherDropped) {
                stretcherDropped = true; // bed out
            }
        }
        // Handle patient walking to stretcher when triggered
        if (patientMovingToStretcher && stretcherDropped && patient && !patient.onStretcher) {
            const bedX = ambulance.x - 10;
            const bedY = ambulance.y + 40 - 8;
            const dx = bedX - patient.x;
            const dy = bedY - patient.y;
            const dist = Math.hypot(dx, dy);
            const step = 4;
            if (dist <= step) {
                patient.onStretcher = true;
                patientMovingToStretcher = false;
                emergencyStage = 4; // proceed once loaded
                emergencyStageStart = now;
            } else {
                patient.x += (dx / dist) * step;
                patient.y += (dy / dist) * step;
            }
        }
    } else if (emergencyStage === 4) {
        // Backup police arrives
        if (backupPolice.x > backupPolice.targetX) {
            backupPolice.x -= backupPolice.speed;
        } else if (now - emergencyStageStart > 600) {
            emergencyStage = 5;
            emergencyStageStart = now;
        }
    } else if (emergencyStage === 5) {
        // Ambulance departs with patient on stretcher
        ambulance.x += ambulance.speed * 1.2;
        // If tow requested, bring in tow truck from right
        if (towRequested) {
            if (!towTruck) {
                towTruck = { x: GAME_WIDTH + 160, y: POLICE_CAR_Y + 10, speed: 5, targetX: Math.min(GAME_WIDTH - 80, crashStartX + 130) };
            } else if (towTruck.x > towTruck.targetX) {
                towTruck.x -= towTruck.speed;
            } else if (!policeCarOnTow) {
                // Load police car onto tow when aligned
                attachPoliceCarToTow();
            }
        }
        if (ambulance.x > GAME_WIDTH + 180) {
            emergencyStage = 6;
            emergencyStageStart = now;
        }
    } else if (emergencyStage === 6) {
        // Tow truck departs with police car if available, then auto restart
        if (towTruck && policeCarOnTow) {
            // Move both together to the right
            towTruck.x += towTruck.speed * 1.2;
            // Move police car position to stay on tow
            policeCarX = towTruck.x - 24; // visual offset onto the tray
        }
        // If requested, send emergency vehicles back to the station (left side)
        if (vehiclesReturnRequested) {
            updateVehiclesReturnToStation();
        }
        const towHasCompleted = !towRequested || (towTruck && policeCarOnTow && towTruck.x > GAME_WIDTH + 180);
        const vehiclesExitedLeft = !vehiclesReturnRequested || (
            (!fireTruck || fireTruck.x < -200) && (!ambulance || ambulance.x < -200) && (!backupPolice || backupPolice.x < -200)
        );
        if (towHasCompleted && vehiclesExitedLeft && now - emergencyStageStart > 800) {
            const btn = document.getElementById('restart-btn');
            if (btn) {
                btn.click();
            } else {
                restartGame();
            }
            isCrashSequenceRunning = false;
        }
    }
}

function drawCrashEffects() {
    drawFlames();
    drawWaterSpray();
    if (fireTruck) drawFireTruck(fireTruck);
    if (ambulance) drawAmbulance(ambulance);
    if (backupPolice) drawBackupPolice(backupPolice);
    drawStretcher();
    drawPatient();
    if (towTruck && !policeCarOnTow) drawTowTruck(towTruck);
}

function drawStation() {
    ctx.save();
    ctx.font = '28px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    // Simple station icons along left
    ctx.fillText('🏥', station.x, 40); // hospital/ambulance base
    ctx.fillText('🚒', station.x, 80); // fire station
    ctx.fillText('🏢', station.x, 120); // police station
    ctx.restore();
}

function updateVehiclesReturnToStation() {
    if (!vehiclesReturnRequested) return;
    // Move fire truck left off screen
    if (fireTruck) {
        fireTruck.x -= fireTruck.speed;
    }
    // Move ambulance left off screen
    if (ambulance) {
        ambulance.x -= ambulance.speed;
    }
    // Move backup police left off screen
    if (backupPolice) {
        backupPolice.x -= backupPolice.speed;
    }
}

// Police car drawing
function drawPoliceCar() {
    ctx.save();
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚔', policeCarX + POLICE_CAR_WIDTH / 2, POLICE_CAR_Y + POLICE_CAR_HEIGHT / 2);
    ctx.restore();
}

// Bad guy drawing
function drawBadGuy(badGuy) {
    ctx.save();
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👤', badGuy.x + BAD_GUY_WIDTH / 2, badGuy.y + BAD_GUY_HEIGHT / 2);
    ctx.restore();
}

// Obstacle drawing
function drawObstacle(obstacle) {
    ctx.save();
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚧', obstacle.x + OBSTACLE_WIDTH / 2, obstacle.y + OBSTACLE_HEIGHT / 2);
    ctx.restore();
}

// Spawn a bad guy
function spawnBadGuy() {
    const now = Date.now();
    if (now - lastBadGuySpawn > BAD_GUY_SPAWN_INTERVAL) {
        badGuys.push({
            x: Math.random() * (GAME_WIDTH - BAD_GUY_WIDTH),
            y: -BAD_GUY_HEIGHT,
            speed: BAD_GUY_SPEED + Math.random() * 2
        });
        lastBadGuySpawn = now;
    }
}

// Spawn an obstacle
function spawnObstacle() {
    const now = Date.now();
    if (now - lastObstacleSpawn > OBSTACLE_SPAWN_INTERVAL) {
        obstacles.push({
            x: Math.random() * (GAME_WIDTH - OBSTACLE_WIDTH),
            y: -OBSTACLE_HEIGHT,
            speed: OBSTACLE_SPEED + Math.random() * 2
        });
        lastObstacleSpawn = now;
    }
}

// Update bad guys
function updateBadGuys() {
    for (let i = badGuys.length - 1; i >= 0; i--) {
        const badGuy = badGuys[i];
        badGuy.y += badGuy.speed;
        
        // Remove if off screen
        if (badGuy.y > GAME_HEIGHT) {
            badGuys.splice(i, 1);
        }
    }
}

// Update obstacles
function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.y += obstacle.speed;
        
        // Remove if off screen
        if (obstacle.y > GAME_HEIGHT) {
            obstacles.splice(i, 1);
        }
    }
}

// Check collision between two rectangles
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Check collisions
function checkCollisions() {
    const policeCar = {
        x: policeCarX,
        y: POLICE_CAR_Y,
        width: POLICE_CAR_WIDTH,
        height: POLICE_CAR_HEIGHT
    };
    
    // Check bad guy collisions
    for (let i = badGuys.length - 1; i >= 0; i--) {
        const badGuy = badGuys[i];
        if (checkCollision(policeCar, {
            x: badGuy.x,
            y: badGuy.y,
            width: BAD_GUY_WIDTH,
            height: BAD_GUY_HEIGHT
        })) {
            // Caught a bad guy!
            badGuys.splice(i, 1);
            score++;
            
            // Check if game is won
            if (score >= WIN_SCORE) {
                gameWon = true;
                gameOver = true;
                showWinScreen();
            }
        }
    }
    
    // Check obstacle collisions
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        if (checkCollision(policeCar, {
            x: obstacle.x,
            y: obstacle.y,
            width: OBSTACLE_WIDTH,
            height: OBSTACLE_HEIGHT
        })) {
            // Hit an obstacle - crash sequence
            gameOver = true;
            startCrashSequence();
            break;
        }
    }
}

// Draw road
function drawRoad() {
    // Draw road background
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw road lines
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 20]);
    
    for (let i = 0; i < GAME_HEIGHT; i += 40) {
        ctx.beginPath();
        ctx.moveTo(GAME_WIDTH / 2, i);
        ctx.lineTo(GAME_WIDTH / 2, i + 20);
        ctx.stroke();
    }
    
    ctx.setLineDash([]);
}

// Draw score
function drawScore() {
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}/${WIN_SCORE}`, 10, 30);
    ctx.restore();
}

// Show game over screen
function showGameOverScreen() {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);
    
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${score}/${WIN_SCORE}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);
    ctx.fillText('Press R to restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
    ctx.restore();
}

// Show win screen
function showWinScreen() {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 You Win! 🎉', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);
    
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${score}/${WIN_SCORE}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);
    ctx.fillText('Press R to play again', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
    ctx.restore();
    
    // Show trophy and restart button
    document.getElementById('trophy-restart').style.display = 'flex';
    document.getElementById('progress-bar').style.width = '100%';
}

// Update progress bar
function updateProgressBar() {
    const progress = (score / WIN_SCORE) * 100;
    document.getElementById('progress-bar').style.width = progress + '%';
}

// Game loop
function gameLoop() {
    if (!gameOver) {
        // Clear and draw gameplay
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        drawRoad();
        drawStation();

        // Update game objects
        spawnBadGuy();
        spawnObstacle();
        updateBadGuys();
        updateObstacles();
        checkCollisions();

        // Draw game objects
        drawPoliceCar();
        badGuys.forEach(drawBadGuy);
        obstacles.forEach(drawObstacle);

        // Draw UI
        drawScore();
        updateProgressBar();
    } else if (isCrashSequenceRunning) {
        // Clear and render emergency response sequence
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        drawRoad();
        drawStation();
        // Draw police car either on ground or on tow truck
        if (policeCarOnTow && towTruck) {
            // Draw tow first, then car on top for clarity
            drawCrashEffects();
            drawTowTruck(towTruck);
            drawPoliceCar();
        } else {
            drawPoliceCar();
            drawCrashEffects();
            if (towTruck) drawTowTruck(towTruck);
        }
        updateCrashSequence();
        drawScore();
        updateProgressBar();
    }

    requestAnimationFrame(gameLoop);
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    if (gameOver) {
        if (isCrashSequenceRunning) {
            // During crash sequence, Space cycles actions: 1) patient to bed, 2) request tow, 3+) return vehicles
            if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                emergencySpacePressCount++;
                if (emergencySpacePressCount === 1 && stretcherDropped && patient && !patient.onStretcher) {
                    patientMovingToStretcher = true;
                } else if (emergencySpacePressCount === 2 && patient && patient.onStretcher) {
                    towRequested = true;
                } else if (emergencySpacePressCount >= 3) {
                    vehiclesReturnRequested = true;
                }
            }
        }
        if (e.key === 'r' || e.key === 'R') {
            restartGame();
        }
        return;
    }
    
    switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            leftPressed = true;
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            rightPressed = true;
            break;
        case ' ': // Space triggers context-sensitive action
        case 'Spacebar':
            // During crash sequence, Space first moves patient, then requests tow
            if (isCrashSequenceRunning) {
                emergencySpacePressCount++;
                if (emergencySpacePressCount === 1 && !patientMovingToStretcher && patient && !patient.onStretcher && stretcherDropped) {
                    patientMovingToStretcher = true;
                } else if (emergencySpacePressCount === 2 && patient && patient.onStretcher) {
                    towRequested = true;
                } else if (emergencySpacePressCount >= 3) {
                    vehiclesReturnRequested = true;
                }
            }
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            leftPressed = false;
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            rightPressed = false;
            break;
    }
});

// Handle mobile tilt
if (isMobile) {
    window.addEventListener('deviceorientation', (e) => {
        if (e.beta !== null) {
            tiltX = e.beta;
        }
    });
}

// Update player position
function updatePlayerPosition() {
    if (gameOver) return;
    
    if (isMobile) {
        // Use tilt for mobile
        if (tiltX < 0) {
            policeCarX -= POLICE_CAR_SPEED;
        } else if (tiltX > 0) {
            policeCarX += POLICE_CAR_SPEED;
        }
    } else {
        // Use keyboard for desktop
        if (leftPressed) {
            policeCarX -= POLICE_CAR_SPEED;
        }
        if (rightPressed) {
            policeCarX += POLICE_CAR_SPEED;
        }
    }
    
    // Keep police car within bounds
    policeCarX = Math.max(0, Math.min(GAME_WIDTH - POLICE_CAR_WIDTH, policeCarX));
}

// Restart game
function restartGame() {
    policeCarX = GAME_WIDTH / 2 - POLICE_CAR_WIDTH / 2;
    badGuys = [];
    obstacles = [];
    score = 0;
    gameOver = false;
    gameWon = false;
    lastBadGuySpawn = 0;
    lastObstacleSpawn = 0;

    // Reset emergency sequence
    isCrashSequenceRunning = false;
    hasFire = false;
    fireTruck = null;
    ambulance = null;
    backupPolice = null;
    stretcherDropped = false;
    flamesAlpha = 1;
    waterAnimationT = 0;
    emergencyStage = 0;
    patient = null;
    patientMovingToStretcher = false;
    towTruck = null;
    towRequested = false;
    policeCarOnTow = false;

    // Hide trophy and reset progress bar
    document.getElementById('trophy-restart').style.display = 'none';
    document.getElementById('progress-bar').style.width = '0%';
}

// Handle restart button click
document.getElementById('restart-btn').addEventListener('click', restartGame);

// Update loop for player position
function updateLoop() {
    updatePlayerPosition();
    requestAnimationFrame(updateLoop);
}

// Start the game
updateLoop();
gameLoop(); 