// James the Vacuum Up Game
class VacuumGame {
    constructor() {
        this.vacuum = document.getElementById('vacuum');
        this.gameContainer = document.getElementById('gameContainer');
        this.scoreElement = document.getElementById('score');
        // Timer removed
        this.itemCountElement = document.getElementById('itemCount');
        this.capacityFillElement = document.getElementById('capacityFill');
        this.capacityTextElement = document.getElementById('capacityText');
        this.chargerStationElement = document.getElementById('chargerStation');
        this.beepSoundElement = document.getElementById('beepSound');
        this.chargeButtonElement = document.getElementById('chargeButton');
        this.gameOverElement = document.getElementById('gameOver');
        this.gameOverTitle = document.getElementById('gameOverTitle');
        this.gameOverMessage = document.getElementById('gameOverMessage');

        this.vacuumX = 50;
        this.vacuumY = 50;
        this.vacuumSpeed = 5;
        this.score = 0;
        // Timer removed
        this.vacuumCapacity = 0;
        this.maxCapacity = 10;
        this.isFull = false;
        this.isCharging = false;
        this.collectibles = [];
        this.warningSigns = [];
        this.gameRunning = true;
        this.keys = {};

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createWarningSigns();
        this.createCollectibles();
        this.setupChargerStation();
        this.updateVacuumPosition();
        this.updateCapacityDisplay();
        this.startGameLoop();
        // Timer removed
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // Spacebar to return to charger
            if (e.key === ' ' && this.isFull) {
                e.preventDefault();
                this.returnToCharger();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    createCollectibles() {
        const containerRect = this.gameContainer.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;

        // Define different types of collectibles with their emojis and scores
        const collectibleTypes = [
            { emoji: '🏠', type: 'house', score: 15, color: '#8B4513' },
            { emoji: '👥', type: 'person', score: 10, color: '#FFD700' },
            { emoji: '🧱', type: 'lego', score: 5, color: '#FF6B6B' }
        ];

        // Create 20 collectibles randomly placed, avoiding warning signs
        for (let i = 0; i < 20; i++) {
            const collectible = document.createElement('div');
            const typeData = collectibleTypes[Math.floor(Math.random() * collectibleTypes.length)];
            
            collectible.className = `collectible ${typeData.type}`;
            collectible.id = `collectible-${i}`;
            collectible.textContent = typeData.emoji;
            
            let x, y;
            let attempts = 0;
            let validPosition = false;
            
            // Try to find a valid position that doesn't overlap with warning signs or other collectibles
            do {
                x = Math.random() * (containerWidth - 30) + 15;
                y = Math.random() * (containerHeight - 30) + 15;
                
                // Check if position is too close to vacuum start position
                const distanceFromStart = Math.sqrt(Math.pow(x - 50, 2) + Math.pow(y - 50, 2));
                
                if (distanceFromStart > 80) {
                    // Check if position is far enough from warning signs
                    validPosition = true;
                    for (let j = 0; j < this.warningSigns.length; j++) {
                        const sign = this.warningSigns[j];
                        const distance = Math.sqrt(
                            Math.pow(x - sign.x, 2) + Math.pow(y - sign.y, 2)
                        );
                        
                        // Keep collectibles at least 80 pixels away from signs
                        if (distance < 80) {
                            validPosition = false;
                            break;
                        }
                    }
                    
                    // Check if position is far enough from other collectibles
                    if (validPosition) {
                        for (let k = 0; k < this.collectibles.length; k++) {
                            const existingCollectible = this.collectibles[k];
                            const distance = Math.sqrt(
                                Math.pow(x - existingCollectible.x, 2) + Math.pow(y - existingCollectible.y, 2)
                            );
                            
                            // Keep collectibles at least 40 pixels away from each other
                            if (distance < 40) {
                                validPosition = false;
                                break;
                            }
                        }
                    }
                }
                
                attempts++;
            } while (!validPosition && attempts < 50);
            
            // If we couldn't find a valid position after many attempts, place it anyway
            if (!validPosition) {
                x = Math.random() * (containerWidth - 30) + 15;
                y = Math.random() * (containerHeight - 30) + 15;
            }
            
            collectible.style.left = x + 'px';
            collectible.style.top = y + 'px';
            
            this.gameContainer.appendChild(collectible);
            this.collectibles.push({
                element: collectible,
                x: x,
                y: y,
                collected: false,
                type: typeData.type,
                emoji: typeData.emoji,
                score: typeData.score
            });
        }
    }

    createWarningSigns() {
        const containerRect = this.gameContainer.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;

        // Create exactly 2 warning signs with proper spacing
        const numSigns = 2;
        const minDistance = 120; // Minimum distance between signs
        const signWidth = 80;
        const signHeight = 100;
        
        for (let i = 0; i < numSigns; i++) {
            const sign = document.createElement('div');
            sign.className = 'warning-sign';
            sign.id = `sign-${i}`;
            
            let x, y;
            let attempts = 0;
            let validPosition = false;
            
            // Try to find a valid position that doesn't overlap with other signs
            do {
                x = Math.random() * (containerWidth - signWidth) + (signWidth / 2);
                y = Math.random() * (containerHeight - signHeight) + (signHeight / 2);
                
                // Check if position is too close to vacuum start position
                const distanceFromStart = Math.sqrt(Math.pow(x - 50, 2) + Math.pow(y - 50, 2));
                
                if (distanceFromStart > 100) {
                    // Check if position is far enough from other signs
                    validPosition = true;
                    for (let j = 0; j < this.warningSigns.length; j++) {
                        const existingSign = this.warningSigns[j];
                        const distance = Math.sqrt(
                            Math.pow(x - existingSign.x, 2) + Math.pow(y - existingSign.y, 2)
                        );
                        
                        if (distance < minDistance) {
                            validPosition = false;
                            break;
                        }
                    }
                }
                
                attempts++;
            } while (!validPosition && attempts < 50);
            
            // If we couldn't find a valid position after many attempts, place it anyway
            if (!validPosition) {
                x = Math.random() * (containerWidth - signWidth) + (signWidth / 2);
                y = Math.random() * (containerHeight - signHeight) + (signHeight / 2);
            }
            
            sign.style.left = x + 'px';
            sign.style.top = y + 'px';
            
            this.gameContainer.appendChild(sign);
            this.warningSigns.push({
                element: sign,
                x: x,
                y: y
            });
        }
    }

    setupChargerStation() {
        const containerRect = this.gameContainer.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        
        // Place charger station in bottom right corner
        const chargerX = containerWidth - 120;
        const chargerY = containerHeight - 100;
        
        this.chargerStationElement.style.left = chargerX + 'px';
        this.chargerStationElement.style.top = chargerY + 'px';
        
        this.chargerX = chargerX;
        this.chargerY = chargerY;
    }

    updateCapacityDisplay() {
        const percentage = (this.vacuumCapacity / this.maxCapacity) * 100;
        this.capacityFillElement.style.width = percentage + '%';
        this.capacityTextElement.textContent = `${this.vacuumCapacity}/${this.maxCapacity}`;
        
        // Add full class when capacity is at maximum
        if (this.vacuumCapacity >= this.maxCapacity) {
            this.capacityFillElement.parentElement.classList.add('full');
        } else {
            this.capacityFillElement.parentElement.classList.remove('full');
        }
    }

    updateVacuumPosition() {
        this.vacuum.style.left = this.vacuumX + 'px';
        this.vacuum.style.top = this.vacuumY + 'px';
    }

    handleMovement() {
        // Don't allow movement if vacuum is full and not at charger
        if (this.isFull && !this.isAtCharger()) {
            return;
        }

        const containerRect = this.gameContainer.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        const vacuumWidth = 60;
        const vacuumHeight = 40;

        if (this.keys['ArrowLeft'] && this.vacuumX > 0) {
            this.vacuumX -= this.vacuumSpeed;
        }
        if (this.keys['ArrowRight'] && this.vacuumX < containerWidth - vacuumWidth) {
            this.vacuumX += this.vacuumSpeed;
        }
        if (this.keys['ArrowUp'] && this.vacuumY > 0) {
            this.vacuumY -= this.vacuumSpeed;
        }
        if (this.keys['ArrowDown'] && this.vacuumY < containerHeight - vacuumHeight) {
            this.vacuumY += this.vacuumSpeed;
        }

        this.updateVacuumPosition();
    }

    isAtCharger() {
        const distance = Math.sqrt(
            Math.pow(this.vacuumX - this.chargerX, 2) + Math.pow(this.vacuumY - this.chargerY, 2)
        );
        return distance < 80; // Within 80 pixels of charger
    }

    checkCollisions() {
        // Check collision with warning signs first (game over)
        const vacuumRect = {
            x: this.vacuumX,
            y: this.vacuumY,
            width: 60,
            height: 40
        };

        this.warningSigns.forEach((sign) => {
            const signRect = {
                x: sign.x,
                y: sign.y,
                width: 80,
                height: 100
            };

            if (this.isColliding(vacuumRect, signRect)) {
                this.endGame(false, 'crash');
                return;
            }
        });

        // Check collision with collectibles (only if vacuum is not full)
        if (!this.isFull) {
            this.collectibles.forEach((collectible, index) => {
                if (!collectible.collected) {
                    const collectibleRect = {
                        x: collectible.x,
                        y: collectible.y,
                        width: 30,
                        height: 30
                    };

                    // Check collision
                    if (this.isColliding(vacuumRect, collectibleRect)) {
                        this.collectItem(collectible, index);
                    }
                }
            });
        }
    }

    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    collectItem(collectible, index) {
        // Don't collect if vacuum is full
        if (this.isFull) {
            return;
        }

        collectible.collected = true;
        collectible.element.style.display = 'none';
        
        // Create suck effect
        this.createSuckEffect(collectible.x + 15, collectible.y + 15);
        
        // Update vacuum capacity
        this.vacuumCapacity++;
        this.updateCapacityDisplay();
        
        // Check if vacuum is now full
        if (this.vacuumCapacity >= this.maxCapacity) {
            this.isFull = true;
            this.showBeepWarning();
            this.chargeButtonElement.classList.add('visible');
        }
        
        // Update score based on item type
        this.score += collectible.score;
        this.scoreElement.textContent = this.score;
        
        // Update item count
        const remainingItems = this.collectibles.filter(c => !c.collected).length;
        this.itemCountElement.textContent = remainingItems;
        
        // Check win condition
        if (remainingItems === 0) {
            this.endGame(true);
        }
    }

    showBeepWarning() {
        this.beepSoundElement.style.display = 'block';
        setTimeout(() => {
            this.beepSoundElement.style.display = 'none';
        }, 2000);
    }

    createSuckEffect(x, y) {
        const effect = document.createElement('div');
        effect.className = 'suck-effect';
        effect.style.left = x + 'px';
        effect.style.top = y + 'px';
        this.gameContainer.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 500);
    }

    // Timer removed

    endGame(won, reason = 'normal') {
        this.gameRunning = false;
        // No timer to clear
        
        if (won) {
            this.gameOverTitle.textContent = '🎉 You Win! 🎉';
            this.gameOverMessage.textContent = `Great job James! You vacuumed up all the houses, people, and Lego blocks! Final Score: ${this.score}`;
        } else if (reason === 'crash') {
            this.gameOverTitle.textContent = '💥 CRASH! 💥';
            this.gameOverMessage.textContent = `Oh no James! You crashed into a warning sign! You scored ${this.score} points before the crash. Be more careful next time!`;
        } else {
            this.gameOverTitle.textContent = 'Game Over!';
            this.gameOverMessage.textContent = `You scored ${this.score} points. Try again to get them all!`;
        }
        
        this.gameOverElement.style.display = 'block';
    }

    startGameLoop() {
        const gameLoop = () => {
            if (this.gameRunning) {
                this.handleMovement();
                this.checkCollisions();
                requestAnimationFrame(gameLoop);
            }
        };
        gameLoop();
    }

    restart() {
        // Reset game state
        this.vacuumX = 50;
        this.vacuumY = 50;
        this.score = 0;
        
        this.vacuumCapacity = 0;
        this.isFull = false;
        this.isCharging = false;
        this.gameRunning = true;
        
        // Clear existing collectibles
        this.collectibles.forEach(collectible => {
            collectible.element.remove();
        });
        this.collectibles = [];
        
        // Clear existing warning signs
        this.warningSigns.forEach(sign => {
            sign.element.remove();
        });
        this.warningSigns = [];
        
        // Reset UI
        this.scoreElement.textContent = this.score;
        
        this.itemCountElement.textContent = '20';
        this.updateCapacityDisplay();
        this.chargeButtonElement.classList.remove('visible');
        this.beepSoundElement.style.display = 'none';
        this.gameOverElement.style.display = 'none';
        
        // Restart game
        this.createWarningSigns();
        this.createCollectibles();
        this.setupChargerStation();
        this.updateVacuumPosition();
        
        this.startGameLoop();
    }

    returnToCharger() {
        if (!this.isFull) return;
        
        // Move vacuum to charger position
        this.vacuumX = this.chargerX + 20;
        this.vacuumY = this.chargerY + 10;
        this.updateVacuumPosition();
        
        // Empty the vacuum
        this.vacuumCapacity = 0;
        this.isFull = false;
        this.isCharging = false;
        this.updateCapacityDisplay();
        
        // Hide the charge button
        this.chargeButtonElement.classList.remove('visible');
        
        // Show charging effect
        this.chargerStationElement.style.boxShadow = '0 0 25px rgba(52, 152, 219, 0.8)';
        setTimeout(() => {
            this.chargerStationElement.style.boxShadow = '0 0 15px rgba(52, 152, 219, 0.5)';
        }, 1000);
    }
}

// Initialize game when page loads
let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new VacuumGame();
});

// Restart function for the button
function restartGame() {
    if (game) {
        game.restart();
    }
}

// Return to charger function
function returnToCharger() {
    if (game && game.isFull) {
        game.returnToCharger();
    }
}

// Prevent arrow keys and spacebar from scrolling the page
document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
});
