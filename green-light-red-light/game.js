class ComputerPlayer {
    constructor(id, color, position) {
        this.id = id;
        this.element = document.createElement('div');
        this.element.className = 'player computer';
        this.element.style.backgroundColor = color;
        this.element.style.bottom = `${position}px`;
        this.position = 0;
        this.verticalPosition = position;
        this.isMoving = false;
        this.isEliminated = false;
        this.reactionTime = Math.random() * 500 + 200; // Random reaction time between 200-700ms
        this.stopChance = Math.random() * 0.3 + 0.1; // Random chance to stop (10-40%)
        this.moveChance = Math.random() * 0.3 + 0.1; // Random chance to start moving again (10-40%)
        this.verticalMoveInterval = null;
        this.horizontalMoveInterval = null;
    }

    move(direction) {
        if (direction === 'right') {
            this.position += 5;
            this.element.style.transform = `translateX(${this.position}px)`;
        } else if (direction === 'up' && this.verticalPosition < 320) {
            this.verticalPosition += 5;
            this.element.style.bottom = `${this.verticalPosition}px`;
        } else if (direction === 'down' && this.verticalPosition > 0) {
            this.verticalPosition -= 5;
            this.element.style.bottom = `${this.verticalPosition}px`;
        }
    }

    eliminate() {
        this.isEliminated = true;
        this.element.classList.add('computer-eliminated');
        clearInterval(this.verticalMoveInterval);
        clearInterval(this.horizontalMoveInterval);
        // Reset position after a short delay
        setTimeout(() => {
            this.reset();
        }, 500);
    }

    reset() {
        this.position = 0;
        this.verticalPosition = 40 + (this.id * 60);
        this.isMoving = false;
        this.isEliminated = false;
        this.element.style.transform = 'translateX(0px)';
        this.element.style.bottom = `${this.verticalPosition}px`;
        this.element.classList.remove('computer-eliminated');
        clearInterval(this.verticalMoveInterval);
        clearInterval(this.horizontalMoveInterval);
    }

    shouldStop() {
        return Math.random() < this.stopChance;
    }

    shouldStart() {
        return Math.random() < this.moveChance;
    }

    getBoundingBox() {
        return {
            left: this.position,
            right: this.position + 35,
            top: this.verticalPosition,
            bottom: this.verticalPosition + 35
        };
    }
}

class RedLightGreenLight {
    constructor() {
        this.player = document.getElementById('player');
        this.startButton = document.getElementById('startButton');
        this.scoreElement = document.getElementById('score');
        this.redLight = document.querySelector('.red');
        this.greenLight = document.querySelector('.green');
        this.computerPlayersContainer = document.getElementById('computer-players');
        this.obstaclesContainer = document.getElementById('obstacles');
        
        this.score = 0;
        this.isGameRunning = false;
        this.isGreenLight = false;
        this.playerPosition = 0;
        this.playerVerticalPosition = 0;
        this.isMoving = false;
        this.movementInterval = null;
        this.computerPlayers = [];
        this.computerColors = ['#FF4444', '#44FF44', '#FFAA44', '#44AAFF', '#AA44FF'];
        this.winner = null;
        this.obstacles = [];
        this.keys = {
            ArrowRight: false,
            ArrowLeft: false,
            ArrowUp: false,
            ArrowDown: false
        };
        
        this.startButton.addEventListener('click', () => this.startGame());
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    createObstacles() {
        this.obstaclesContainer.innerHTML = '';
        this.obstacles = [];

        // Create 8-12 random obstacles
        const numObstacles = Math.floor(Math.random() * 5) + 8;
        for (let i = 0; i < numObstacles; i++) {
            const obstacle = document.createElement('div');
            obstacle.className = 'obstacle';
            
            // Random position and size
            const width = Math.random() * 40 + 20; // 20-60px wide
            const height = Math.random() * 40 + 20; // 20-60px tall
            const left = Math.random() * 500 + 50; // 50-550px from left
            const bottom = Math.random() * 300 + 20; // 20-320px from bottom
            
            obstacle.style.width = `${width}px`;
            obstacle.style.height = `${height}px`;
            obstacle.style.left = `${left}px`;
            obstacle.style.bottom = `${bottom}px`;
            
            this.obstaclesContainer.appendChild(obstacle);
            this.obstacles.push({
                element: obstacle,
                left: left,
                right: left + width,
                top: bottom,
                bottom: bottom + height
            });
        }
    }

    checkCollision(position, verticalPosition, isComputer = false) {
        const playerSize = isComputer ? 35 : 40;
        const playerBox = {
            left: position,
            right: position + playerSize,
            top: verticalPosition,
            bottom: verticalPosition + playerSize
        };

        return this.obstacles.some(obstacle => 
            playerBox.right > obstacle.left &&
            playerBox.left < obstacle.right &&
            playerBox.bottom > obstacle.top &&
            playerBox.top < obstacle.bottom
        );
    }

    createComputerPlayers() {
        this.computerPlayersContainer.innerHTML = '';
        this.computerPlayers = [];

        for (let i = 0; i < 5; i++) {
            const computer = new ComputerPlayer(
                i,
                this.computerColors[i],
                40 + (i * 60)
            );
            this.computerPlayersContainer.appendChild(computer.element);
            this.computerPlayers.push(computer);
        }
    }

    startGame() {
        if (this.isGameRunning) {
            this.resetGame();
            return;
        }

        this.isGameRunning = true;
        this.startButton.textContent = 'Reset Game';
        this.createObstacles();
        this.createComputerPlayers();
        this.updateLights();
    }

    resetGame() {
        this.isGameRunning = false;
        this.score = 0;
        this.playerPosition = 0;
        this.playerVerticalPosition = 0;
        this.isMoving = false;
        this.winner = null;
        this.startButton.textContent = 'Start Game';
        this.scoreElement.textContent = '0';
        this.player.style.transform = 'translateX(0px)';
        this.player.style.bottom = '0px';
        this.redLight.classList.add('active');
        this.greenLight.classList.remove('active');
        clearInterval(this.movementInterval);
        
        this.computerPlayers.forEach(computer => computer.reset());
    }

    updateLights() {
        this.isGreenLight = !this.isGreenLight;
        if (this.isGreenLight) {
            this.redLight.classList.remove('active');
            this.greenLight.classList.add('active');
            this.startComputerMovement();
        } else {
            this.redLight.classList.add('active');
            this.greenLight.classList.remove('active');
            if (this.isMoving) {
                this.playerEliminated();
            }
            this.computerPlayers.forEach(computer => {
                if (computer.isMoving && !computer.isEliminated) {
                    computer.eliminate();
                }
            });
        }
    }

    playerEliminated() {
        this.isMoving = false;
        this.playerPosition = 0;
        this.playerVerticalPosition = 0;
        this.player.style.transform = 'translateX(0px)';
        this.player.style.bottom = '0px';
        this.score = 0;
        this.scoreElement.textContent = '0';
    }

    startComputerMovement() {
        this.computerPlayers.forEach(computer => {
            if (!computer.isEliminated) {
                setTimeout(() => {
                    if (this.isGreenLight && !computer.isEliminated && this.isGameRunning) {
                        computer.isMoving = true;
                        this.moveComputerPlayer(computer);
                    }
                }, computer.reactionTime);
            }
        });
    }

    moveComputerPlayer(computer) {
        if (!computer.isMoving || computer.isEliminated || !this.isGameRunning) return;

        // Random vertical movement
        if (!computer.verticalMoveInterval) {
            computer.verticalMoveInterval = setInterval(() => {
                if (this.isGreenLight && !computer.isEliminated && this.isGameRunning) {
                    const direction = Math.random() < 0.5 ? 'up' : 'down';
                    if (!this.checkCollision(computer.position, 
                        direction === 'up' ? computer.verticalPosition + 5 : computer.verticalPosition - 5, 
                        true)) {
                        computer.move(direction);
                    }
                }
            }, 1000); // Fixed interval of 1 second
        }

        // Random horizontal movement
        if (!computer.horizontalMoveInterval) {
            computer.horizontalMoveInterval = setInterval(() => {
                if (this.isGreenLight && !computer.isEliminated && this.isGameRunning) {
                    if (!this.checkCollision(computer.position + 5, computer.verticalPosition, true)) {
                        computer.move('right');
                        if (computer.position >= 560) {
                            this.endGame('Computer');
                        }
                    }
                }
            }, 500); // Fixed interval of 0.5 seconds
        }
    }

    handleKeyDown(e) {
        if (!this.isGameRunning) return;

        if (e.key === ' ' && this.isGameRunning) {
            e.preventDefault();
            this.updateLights();
        } else if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            this.keys[e.key] = true;
            if (!this.isMoving) {
                this.isMoving = true;
                this.startMovement();
            }
        }
    }

    handleKeyUp(e) {
        if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            this.keys[e.key] = false;
            if (!Object.values(this.keys).some(key => key)) {
                this.isMoving = false;
                clearInterval(this.movementInterval);
            }
        }
    }

    startMovement() {
        this.movementInterval = setInterval(() => {
            if (this.isMoving && this.isGameRunning) {
                if (this.isGreenLight) {
                    let moved = false;
                    
                    if (this.keys.ArrowRight && !this.checkCollision(this.playerPosition + 5, this.playerVerticalPosition)) {
                        this.playerPosition += 5;
                        this.player.style.transform = `translateX(${this.playerPosition}px)`;
                        moved = true;
                    }
                    if (this.keys.ArrowUp && this.playerVerticalPosition < 320 && 
                        !this.checkCollision(this.playerPosition, this.playerVerticalPosition + 5)) {
                        this.playerVerticalPosition += 5;
                        this.player.style.bottom = `${this.playerVerticalPosition}px`;
                        moved = true;
                    }
                    if (this.keys.ArrowDown && this.playerVerticalPosition > 0 && 
                        !this.checkCollision(this.playerPosition, this.playerVerticalPosition - 5)) {
                        this.playerVerticalPosition -= 5;
                        this.player.style.bottom = `${this.playerVerticalPosition}px`;
                        moved = true;
                    }

                    if (moved) {
                        this.score += 1;
                        this.scoreElement.textContent = this.score;
                    }

                    if (this.playerPosition >= 560) {
                        this.endGame('You');
                    }
                } else {
                    this.playerEliminated();
                }
            }
        }, 50);
    }

    endGame(winner) {
        this.isGameRunning = false;
        this.winner = winner;
        this.computerPlayers.forEach(computer => {
            computer.isMoving = false;
            clearInterval(computer.verticalMoveInterval);
            clearInterval(computer.horizontalMoveInterval);
        });
        alert(`${winner} won the game!`);
        this.resetGame();
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new RedLightGreenLight();
}); 