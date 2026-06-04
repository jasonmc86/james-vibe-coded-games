class LaserTagGame {
    constructor() {
        this.gameArea = document.getElementById('gameArea');
        this.player = document.getElementById('player');
        this.scoreElement = document.getElementById('score');
        this.livesElement = document.getElementById('lives');
        this.hungerElement = document.getElementById('hunger');
        this.gameOverElement = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');
        
        this.gameWidth = this.gameArea.offsetWidth;
        this.gameHeight = this.gameArea.offsetHeight;
        
        this.playerX = this.gameWidth / 2;
        this.playerY = this.gameHeight - 60;
        this.playerSpeed = 8;
        
        this.score = 0;
        this.lives = 3;
        this.hunger = 100; // Hunger level (100 = full, 0 = starving)
        this.gameRunning = false;
        
        this.lasers = [];
        this.enemies = [];
        this.enemyLasers = [];
        this.powerUps = [];
        this.explosions = [];
        this.chargers = [];
        
        this.keys = {};
        this.lastShot = 0;
        this.shotCooldown = 200; // milliseconds
        
        this.enemySpawnRate = 2000; // milliseconds
        this.powerUpSpawnRate = 8000; // milliseconds
        this.chargerSpawnRate = 10000; // milliseconds
        this.lastEnemySpawn = 0;
        this.lastPowerUpSpawn = 0;
        this.lastChargerSpawn = 0;
        this.lastHungerDecrease = 0;
        
        this.init();
    }
    
    init() {
        this.createStars();
        this.setupEventListeners();
        this.updatePlayerPosition();
        this.startGame();
    }
    
    createStars() {
        const starsContainer = document.getElementById('stars');
        for (let i = 0; i < 50; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * this.gameWidth + 'px';
            star.style.top = Math.random() * this.gameHeight + 'px';
            star.style.animationDelay = Math.random() * 2 + 's';
            starsContainer.appendChild(star);
        }
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
                this.shoot();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    startGame() {
        this.gameRunning = true;
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        this.handleInput();
        this.updateLasers();
        this.updateEnemies();
        this.updateEnemyLasers();
        this.updatePowerUps();
        this.updateExplosions();
        this.updateChargers();
        this.spawnEnemies();
        this.spawnPowerUps();
        this.spawnChargers();
        this.updateHunger();
        this.checkCollisions();
    }
    
    handleInput() {
        if (this.keys['ArrowLeft'] && this.playerX > 20) {
            this.playerX -= this.playerSpeed;
        }
        if (this.keys['ArrowRight'] && this.playerX < this.gameWidth - 20) {
            this.playerX += this.playerSpeed;
        }
        if (this.keys['ArrowUp'] && this.playerY > 20) {
            this.playerY -= this.playerSpeed;
        }
        if (this.keys['ArrowDown'] && this.playerY < this.gameHeight - 20) {
            this.playerY += this.playerSpeed;
        }
        
        this.updatePlayerPosition();
    }
    
    updatePlayerPosition() {
        this.player.style.left = (this.playerX - 20) + 'px';
        this.player.style.top = (this.playerY - 20) + 'px';
    }
    
    updatePlayerAppearance() {
        if (this.hunger <= 20) {
            // Very hungry - turn into tea cup
            this.player.innerHTML = '🍵';
            this.player.style.background = 'linear-gradient(45deg, #8B4513, #D2691E)';
        } else if (this.hunger < 50) {
            // Hungry - normal appearance but different color
            this.player.innerHTML = '👨';
            this.player.style.background = 'linear-gradient(45deg, #ffaa00, #ff8800)';
        } else {
            // Not hungry - normal green appearance
            this.player.innerHTML = '👨';
            this.player.style.background = 'linear-gradient(45deg, #00ff00, #00cc00)';
        }
    }
    
    updateHunger() {
        const now = Date.now();
        if (now - this.lastHungerDecrease > 1000) { // Decrease hunger every second
            this.lastHungerDecrease = now;
            this.hunger = Math.max(0, this.hunger - 1);
            this.updateHungerDisplay();
            this.updatePlayerAppearance();
        }
    }
    
    updateHungerDisplay() {
        this.hungerElement.textContent = this.hunger;
    }
    
    shoot() {
        const now = Date.now();
        if (now - this.lastShot < this.shotCooldown) return;
        
        this.lastShot = now;
        
        // Only flash rainbow when hungry (hunger < 50)
        if (this.hunger < 50) {
            this.player.style.background = 'linear-gradient(45deg, #ffff00, #ff8800, #ff4444, #8800ff, #0088ff, #00ff00)';
            setTimeout(() => {
                this.updatePlayerAppearance();
            }, 100);
        }
        
        const laser = {
            x: this.playerX,
            y: this.playerY - 15,
            element: this.createLaserElement()
        };
        
        this.lasers.push(laser);
        this.gameArea.appendChild(laser.element);
    }
    
    createLaserElement() {
        const laser = document.createElement('div');
        laser.className = 'laser';
        return laser;
    }
    
    updateLasers() {
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            laser.y -= 10;
            laser.element.style.left = (laser.x - 3) + 'px';
            laser.element.style.top = laser.y + 'px';
            
            if (laser.y < 0) {
                this.lasers.splice(i, 1);
                laser.element.remove();
            }
        }
    }
    
    spawnEnemies() {
        const now = Date.now();
        if (now - this.lastEnemySpawn > this.enemySpawnRate) {
            this.lastEnemySpawn = now;
            
            const enemy = {
                x: Math.random() * (this.gameWidth - 40) + 20,
                y: -20,
                speed: 2 + Math.random() * 2,
                shootTimer: 0,
                gunCharge: 100, // Enemies start with full gun charge
                element: this.createEnemyElement()
            };
            
            this.enemies.push(enemy);
            this.gameArea.appendChild(enemy.element);
        }
    }
    
    createEnemyElement() {
        const enemy = document.createElement('div');
        enemy.className = 'enemy';
        return enemy;
    }
    
    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.y += enemy.speed;
            enemy.shootTimer += 16; // Assuming 60fps
            
            enemy.element.style.left = (enemy.x - 17.5) + 'px';
            enemy.element.style.top = (enemy.y - 17.5) + 'px';
            
            // Enemy shooting (only if they have gun charge)
            if (enemy.shootTimer > 1000 + Math.random() * 1000 && enemy.gunCharge > 0) {
                this.enemyShoot(enemy);
                enemy.shootTimer = 0;
                enemy.gunCharge = Math.max(0, enemy.gunCharge - 10); // Use gun charge when shooting
            }
            
            if (enemy.y > this.gameHeight) {
                this.enemies.splice(i, 1);
                enemy.element.remove();
            }
        }
    }
    
    enemyShoot(enemy) {
        const laser = {
            x: enemy.x,
            y: enemy.y + 20,
            element: this.createEnemyLaserElement()
        };
        
        this.enemyLasers.push(laser);
        this.gameArea.appendChild(laser.element);
    }
    
    createEnemyLaserElement() {
        const laser = document.createElement('div');
        laser.className = 'laser enemy-laser';
        return laser;
    }
    
    updateEnemyLasers() {
        for (let i = this.enemyLasers.length - 1; i >= 0; i--) {
            const laser = this.enemyLasers[i];
            laser.y += 8;
            laser.element.style.left = (laser.x - 3) + 'px';
            laser.element.style.top = laser.y + 'px';
            
            if (laser.y > this.gameHeight) {
                this.enemyLasers.splice(i, 1);
                laser.element.remove();
            }
        }
    }
    
    spawnPowerUps() {
        const now = Date.now();
        if (now - this.lastPowerUpSpawn > this.powerUpSpawnRate) {
            this.lastPowerUpSpawn = now;
            
            const powerUp = {
                x: Math.random() * (this.gameWidth - 30) + 15,
                y: -15,
                speed: 1,
                element: this.createPowerUpElement()
            };
            
            this.powerUps.push(powerUp);
            this.gameArea.appendChild(powerUp.element);
        }
    }
    
    createPowerUpElement() {
        const powerUp = document.createElement('div');
        powerUp.className = 'power-up';
        return powerUp;
    }
    
    updatePowerUps() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.y += powerUp.speed;
            
            powerUp.element.style.left = (powerUp.x - 12.5) + 'px';
            powerUp.element.style.top = (powerUp.y - 12.5) + 'px';
            
            if (powerUp.y > this.gameHeight) {
                this.powerUps.splice(i, 1);
                powerUp.element.remove();
            }
        }
    }
    
    spawnChargers() {
        const now = Date.now();
        if (now - this.lastChargerSpawn > this.chargerSpawnRate) {
            this.lastChargerSpawn = now;
            
            const charger = {
                x: Math.random() * (this.gameWidth - 60) + 30,
                y: Math.random() * (this.gameHeight - 100) + 50,
                element: this.createChargerElement(),
                isActive: true,
                chargeLevel: 100
            };
            
            this.chargers.push(charger);
            this.gameArea.appendChild(charger.element);
        }
    }
    
    createChargerElement() {
        const charger = document.createElement('div');
        charger.className = 'charger';
        return charger;
    }
    
    updateChargers() {
        for (let i = this.chargers.length - 1; i >= 0; i--) {
            const charger = this.chargers[i];
            
            // Update charger appearance based on charge level
            if (charger.chargeLevel > 0) {
                charger.element.style.opacity = '1';
                charger.element.style.boxShadow = '0 0 20px #00ff00';
            } else {
                charger.element.style.opacity = '0.3';
                charger.element.style.boxShadow = '0 0 5px #666';
            }
        }
    }
    
    updateExplosions() {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.timer--;
            
            if (explosion.timer <= 0) {
                this.explosions.splice(i, 1);
                explosion.element.remove();
            }
        }
    }
    
    createExplosion(x, y) {
        const explosion = {
            x: x,
            y: y,
            timer: 30,
            element: document.createElement('div')
        };
        
        explosion.element.className = 'explosion';
        explosion.element.style.left = (x - 30) + 'px';
        explosion.element.style.top = (y - 30) + 'px';
        
        this.explosions.push(explosion);
        this.gameArea.appendChild(explosion.element);
    }
    
    checkCollisions() {
        // Player lasers vs enemies
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                // Calculate distance between laser and enemy centers
                const dx = laser.x - enemy.x;
                const dy = laser.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Debug: log when laser is close to enemy
                if (distance < 100) {
                    console.log('Laser near enemy! Distance:', distance, 'Laser:', laser.x, laser.y, 'Enemy:', enemy.x, enemy.y);
                }
                
                if (distance < 50) { // Even larger collision radius for testing
                    console.log('HIT! Distance:', distance); // Debug log
                    this.createExplosion(enemy.x, enemy.y);
                    this.score += 10;
                    this.updateScore();
                    
                    this.lasers.splice(i, 1);
                    this.enemies.splice(j, 1);
                    laser.element.remove();
                    enemy.element.remove();
                    break;
                }
            }
        }
        
        // Enemy lasers vs player
        for (let i = this.enemyLasers.length - 1; i >= 0; i--) {
            const laser = this.enemyLasers[i];
            if (this.isColliding(laser, {x: this.playerX, y: this.playerY}, 25)) {
                this.takeDamage();
                this.enemyLasers.splice(i, 1);
                laser.element.remove();
            }
        }
        
        // Enemies vs player
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (this.isColliding(enemy, {x: this.playerX, y: this.playerY}, 30)) {
                this.takeDamage();
                this.createExplosion(enemy.x, enemy.y);
                this.enemies.splice(i, 1);
                enemy.element.remove();
            }
        }
        
        // Power-ups vs player
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (this.isColliding(powerUp, {x: this.playerX, y: this.playerY}, 20)) {
                this.collectPowerUp();
                this.powerUps.splice(i, 1);
                powerUp.element.remove();
            }
        }
        
        // Enemies vs chargers (enemies recharge their guns)
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            for (let j = this.chargers.length - 1; j >= 0; j--) {
                const charger = this.chargers[j];
                if (this.isColliding(enemy, charger, 40) && charger.chargeLevel > 0) {
                    // Enemy uses charger to recharge
                    charger.chargeLevel = Math.max(0, charger.chargeLevel - 20);
                    enemy.gunCharge = Math.min(100, (enemy.gunCharge || 0) + 50);
                    
                    // Visual effect when enemy recharges
                    this.createExplosion(enemy.x, enemy.y);
                }
            }
        }
    }
    
    isColliding(obj1, obj2, distance) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        return Math.sqrt(dx * dx + dy * dy) < distance;
    }
    
    takeDamage() {
        this.lives--;
        this.updateLives();
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    collectPowerUp() {
        this.score += 5;
        this.updateScore();
        
        // Restore hunger
        this.hunger = Math.min(100, this.hunger + 30);
        this.updateHungerDisplay();
        this.updatePlayerAppearance();
        
        // Reduce shot cooldown temporarily
        this.shotCooldown = Math.max(100, this.shotCooldown - 50);
        setTimeout(() => {
            this.shotCooldown = Math.min(200, this.shotCooldown + 50);
        }, 5000);
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    updateLives() {
        this.livesElement.textContent = this.lives;
    }
    
    gameOver() {
        this.gameRunning = false;
        this.finalScoreElement.textContent = this.score;
        this.gameOverElement.style.display = 'block';
    }
    
    render() {
        // Game rendering is handled by the update methods
    }
}

function restartGame() {
    // Clear all game elements
    const gameArea = document.getElementById('gameArea');
    const elementsToRemove = gameArea.querySelectorAll('.laser, .enemy, .power-up, .explosion, .charger');
    elementsToRemove.forEach(el => el.remove());
    
    // Hide game over screen
    document.getElementById('gameOver').style.display = 'none';
    
    // Start new game
    window.game = new LaserTagGame();
}

// Start the game when page loads
window.addEventListener('load', () => {
    window.game = new LaserTagGame();
});
