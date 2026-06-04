// James and Daddy's Maze — both players move anytime

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const COLS = 21;
const ROWS = 15;

let cellSize = 40;
let offsetX = 0;
let offsetY = 0;

let maze = [];
let gameStarted = false;
let gameOver = false;
let winner = null;

const james = {
    name: 'James',
    emoji: '🧒',
    color: '#FFD700',
    border: '#0000FF',
    col: 0,
    row: 0,
    facing: 'right'
};

const daddy = {
    name: 'Daddy',
    emoji: '👨',
    color: '#90EE90',
    border: '#FF0000',
    col: 0,
    row: 0
};

let goalCol = 0;
let goalRow = 0;

const JAMES_WALL_REMOVAL_LIMIT = 6;
const DADDY_EXTRA_WALLS_TARGET = 62;
let jamesWallsRemoved = 0;
const jamesStart = { col: 0, row: 0 };
const daddyStart = { col: COLS - 1, row: ROWS - 1 };
const WALL_BY_DIR = { up: 'top', down: 'bottom', left: 'left', right: 'right' };
const OPPOSITE_WALL = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

function nextCell(col, row, dir) {
    if (dir === 'up') return { col, row: row - 1 };
    if (dir === 'down') return { col, row: row + 1 };
    if (dir === 'left') return { col: col - 1, row };
    return { col: col + 1, row };
}

function canReach(start) {
    const queue = [{ col: start.col, row: start.row }];
    const seen = new Set([`${start.col},${start.row}`]);

    while (queue.length) {
        const { col, row } = queue.shift();
        if (col === goalCol && row === goalRow) return true;

        for (const dir of ['up', 'down', 'left', 'right']) {
            if (!canMove(col, row, dir)) continue;
            const next = nextCell(col, row, dir);
            const key = `${next.col},${next.row}`;
            if (seen.has(key)) continue;
            seen.add(key);
            queue.push(next);
        }
    }
    return false;
}

function findShortestPath(start) {
    const queue = [{ col: start.col, row: start.row, path: [{ col: start.col, row: start.row }] }];
    const seen = new Set([`${start.col},${start.row}`]);

    while (queue.length) {
        const { col, row, path } = queue.shift();
        if (col === goalCol && row === goalRow) return path;

        for (const dir of ['up', 'down', 'left', 'right']) {
            if (!canMove(col, row, dir)) continue;
            const next = nextCell(col, row, dir);
            const key = `${next.col},${next.row}`;
            if (seen.has(key)) continue;
            seen.add(key);
            queue.push({
                col: next.col,
                row: next.row,
                path: path.concat([{ col: next.col, row: next.row }])
            });
        }
    }
    return null;
}

function pathLength(start) {
    const path = findShortestPath(start);
    return path ? path.length : Infinity;
}

function manhattanToGoal(col, row) {
    return Math.abs(col - goalCol) + Math.abs(row - goalRow);
}

function isDaddySide(col, row) {
    const distD = Math.abs(col - daddyStart.col) + Math.abs(row - daddyStart.row);
    const distJ = Math.abs(col - jamesStart.col) + Math.abs(row - jamesStart.row);
    const inDaddyCorner = col >= Math.floor(COLS * 0.4) && row >= Math.floor(ROWS * 0.35);
    return distD <= distJ + 3 || inDaddyCorner;
}

function randomDaddyCell() {
    for (let i = 0; i < 20; i++) {
        const c = Math.floor(COLS * 0.38) + Math.floor(Math.random() * (COLS - Math.floor(COLS * 0.38)));
        const r = Math.floor(ROWS * 0.3) + Math.floor(Math.random() * (ROWS - Math.floor(ROWS * 0.3)));
        if (isDaddySide(c, r)) return { col: c, row: r };
    }
    return {
        col: Math.floor(Math.random() * COLS),
        row: Math.floor(Math.random() * ROWS)
    };
}

function idx(c, r) {
    return r * COLS + c;
}

function buildBaseMaze() {
    const cells = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            cells.push({ c, r, walls: { top: true, right: true, bottom: true, left: true }, visited: false });
        }
    }

    function neighbors(cell) {
        const list = [];
        const dirs = [
            { dc: 0, dr: -1, wall: 'top', opp: 'bottom' },
            { dc: 1, dr: 0, wall: 'right', opp: 'left' },
            { dc: 0, dr: 1, wall: 'bottom', opp: 'top' },
            { dc: -1, dr: 0, wall: 'left', opp: 'right' }
        ];
        for (const d of dirs) {
            const nc = cell.c + d.dc;
            const nr = cell.r + d.dr;
            if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS) {
                list.push({ cell: cells[idx(nc, nr)], wall: d.wall, opp: d.opp });
            }
        }
        return list;
    }

    const stack = [cells[idx(jamesStart.col, jamesStart.row)]];
    stack[0].visited = true;

    while (stack.length) {
        const current = stack[stack.length - 1];
        const unvisited = neighbors(current).filter(n => !n.cell.visited);
        if (unvisited.length === 0) {
            stack.pop();
            continue;
        }
        unvisited.sort((a, b) => {
            const distA = manhattanToGoal(a.cell.c, a.cell.r);
            const distB = manhattanToGoal(b.cell.c, b.cell.r);
            return distA - distB;
        });
        const pick = unvisited[Math.floor(Math.random() * Math.min(2, unvisited.length))];
        current.walls[pick.wall] = false;
        pick.cell.walls[pick.opp] = false;
        pick.cell.visited = true;
        stack.push(pick.cell);
    }

    maze = cells;
}

function addWallBetween(col, row, dir) {
    const wall = WALL_BY_DIR[dir];
    const cell = maze[idx(col, row)];
    if (!cell.walls[wall]) {
        cell.walls[wall] = true;
        const next = nextCell(col, row, dir);
        if (next.col >= 0 && next.col < COLS && next.row >= 0 && next.row < ROWS) {
            maze[idx(next.col, next.row)].walls[OPPOSITE_WALL[wall]] = true;
        }
        return true;
    }
    return false;
}

function easeJamesMaze() {
    const path = findShortestPath(jamesStart);
    if (!path) return;

    for (const cell of path) {
        for (const dir of ['up', 'down', 'left', 'right']) {
            const next = nextCell(cell.col, cell.row, dir);
            if (next.col < 0 || next.col >= COLS || next.row < 0 || next.row >= ROWS) continue;
            if (manhattanToGoal(next.col, next.row) < manhattanToGoal(cell.col, cell.row)) {
                removeWallBetween(cell.col, cell.row, dir);
            }
        }
    }
}

function tryAddDaddyWall(c, r, onMainPath, dirs) {
    if (c === goalCol && r === goalRow) return false;
    if (c === daddyStart.col && r === daddyStart.row) return false;
    if (onMainPath.has(`${c},${r}`)) return false;

    const shuffled = dirs.slice().sort(() => Math.random() - 0.5);
    for (const dir of shuffled) {
        if (!addWallBetween(c, r, dir)) continue;
        if (canReach(jamesStart) && canReach(daddyStart)) return true;
        removeWallBetween(c, r, dir);
    }
    return false;
}

function hardenDaddyMaze() {
    const daddyPath = findShortestPath(daddyStart);
    if (!daddyPath) return;

    const onMainPath = new Set(daddyPath.map(c => `${c.col},${c.row}`));
    const dirs = ['up', 'down', 'left', 'right'];
    let added = 0;
    let attempts = 0;

    while (added < DADDY_EXTRA_WALLS_TARGET && attempts < 3500) {
        attempts++;
        const { col: c, row: r } = randomDaddyCell();
        if (!isDaddySide(c, r)) continue;
        if (tryAddDaddyWall(c, r, onMainPath, dirs)) added++;
    }

    for (let r = 0; r < ROWS && added < DADDY_EXTRA_WALLS_TARGET; r++) {
        for (let c = 0; c < COLS && added < DADDY_EXTRA_WALLS_TARGET; c++) {
            if (!isDaddySide(c, r)) continue;
            if (tryAddDaddyWall(c, r, onMainPath, dirs)) added++;
        }
    }
}

function generateMaze() {
    goalCol = Math.floor((COLS - 1) / 2);
    goalRow = Math.floor((ROWS - 1) / 2);

    let bestMaze = null;
    let bestGap = -1;

    for (let attempt = 0; attempt < 12; attempt++) {
        buildBaseMaze();
        easeJamesMaze();
        hardenDaddyMaze();

        const jLen = pathLength(jamesStart);
        const dLen = pathLength(daddyStart);
        if (!canReach(jamesStart) || !canReach(daddyStart)) continue;

        const gap = dLen - jLen;
        if (gap > bestGap) {
            bestGap = gap;
            bestMaze = maze.map(cell => ({
                c: cell.c,
                r: cell.r,
                walls: { ...cell.walls }
            }));
        }
        if (gap >= 12) break;
    }

    if (bestMaze) {
        maze = bestMaze;
    } else {
        buildBaseMaze();
        easeJamesMaze();
    }
}

function layoutGrid() {
    const pad = 24;
    const w = canvas.width - pad * 2;
    const h = canvas.height - pad * 2;
    cellSize = Math.floor(Math.min(w / COLS, h / ROWS));
    const gridW = cellSize * COLS;
    const gridH = cellSize * ROWS;
    offsetX = Math.floor((canvas.width - gridW) / 2);
    offsetY = Math.floor((canvas.height - gridH) / 2);
}

function resetPlayers() {
    james.col = jamesStart.col;
    james.row = jamesStart.row;
    james.facing = 'right';
    daddy.col = daddyStart.col;
    daddy.row = daddyStart.row;
}

function getPlayer(who) {
    return who === 'james' ? james : daddy;
}

function removeWallBetween(col, row, dir) {
    const wall = WALL_BY_DIR[dir];
    const cell = maze[idx(col, row)];
    if (cell.walls[wall]) {
        cell.walls[wall] = false;
        const next = nextCell(col, row, dir);
        if (next.col >= 0 && next.col < COLS && next.row >= 0 && next.row < ROWS) {
            maze[idx(next.col, next.row)].walls[OPPOSITE_WALL[wall]] = false;
        }
        return true;
    }
    return false;
}

function jamesWallsLeft() {
    return JAMES_WALL_REMOVAL_LIMIT - jamesWallsRemoved;
}

function jamesRemoveWall() {
    if (jamesWallsRemoved >= JAMES_WALL_REMOVAL_LIMIT) {
        updateStatus(`James used all ${JAMES_WALL_REMOVAL_LIMIT} wall smashes! No more removals this game.`);
        return false;
    }
    if (removeWallBetween(james.col, james.row, james.facing)) {
        jamesWallsRemoved++;
        const left = jamesWallsLeft();
        updateStatus(`James smashed a wall! (${left} smash${left === 1 ? '' : 'es'} left) Daddy cannot remove walls.`);
        return true;
    }
    updateStatus(`No wall in front of James — face a wall and press Space! (${jamesWallsLeft()} smashes left)`);
    return false;
}

function canMove(col, row, dir) {
    const cell = maze[idx(col, row)];
    if (dir === 'up' && !cell.walls.top && row > 0) return true;
    if (dir === 'down' && !cell.walls.bottom && row < ROWS - 1) return true;
    if (dir === 'left' && !cell.walls.left && col > 0) return true;
    if (dir === 'right' && !cell.walls.right && col < COLS - 1) return true;
    return false;
}

function movePlayer(who, dir) {
    if (!gameStarted || gameOver) return false;

    const p = getPlayer(who);
    let nc = p.col;
    let nr = p.row;

    if (dir === 'up') nr--;
    else if (dir === 'down') nr++;
    else if (dir === 'left') nc--;
    else if (dir === 'right') nc++;

    if (!canMove(p.col, p.row, dir)) return false;

    p.col = nc;
    p.row = nr;

    if (who === 'james') {
        james.facing = dir;
    }

    if (p.col === goalCol && p.row === goalRow) {
        gameOver = true;
        winner = who;
        updateStatus(`🎉 ${p.name} reached the star and wins! 🎉`);
    }
    return true;
}

function updateStatus(text) {
    statusEl.textContent = text;
}

function drawMaze() {
    const wallColor = '#000000';
    const pathColor = '#c8e6a0';
    const wallW = Math.max(3, Math.floor(cellSize * 0.14));

    ctx.fillStyle = pathColor;
    ctx.fillRect(offsetX, offsetY, cellSize * COLS, cellSize * ROWS);

    ctx.strokeStyle = wallColor;
    ctx.lineWidth = wallW;
    ctx.lineCap = 'square';

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x = offsetX + c * cellSize;
            const y = offsetY + r * cellSize;
            const cell = maze[idx(c, r)];

            if (cell.walls.top) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + cellSize, y);
                ctx.stroke();
            }
            if (cell.walls.left) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + cellSize);
                ctx.stroke();
            }
            if (r === ROWS - 1 && cell.walls.bottom) {
                ctx.beginPath();
                ctx.moveTo(x, y + cellSize);
                ctx.lineTo(x + cellSize, y + cellSize);
                ctx.stroke();
            }
            if (c === COLS - 1 && cell.walls.right) {
                ctx.beginPath();
                ctx.moveTo(x + cellSize, y);
                ctx.lineTo(x + cellSize, y + cellSize);
                ctx.stroke();
            }
        }
    }

    const gx = offsetX + goalCol * cellSize + cellSize / 2;
    const gy = offsetY + goalRow * cellSize + cellSize / 2;
    ctx.font = `${Math.floor(cellSize * 0.65)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐', gx, gy);

    ctx.font = `bold ${Math.floor(cellSize * 0.28)}px Arial`;
    ctx.fillStyle = '#1a1a2e';

    const jx = offsetX + jamesStart.col * cellSize + cellSize / 2;
    const jy = offsetY + jamesStart.row * cellSize + cellSize / 2;
    if (james.col !== jamesStart.col || james.row !== jamesStart.row) {
        ctx.fillText('JAMES', jx, jy);
    }

    const dx = offsetX + daddyStart.col * cellSize + cellSize / 2;
    const dy = offsetY + daddyStart.row * cellSize + cellSize / 2;
    if (daddy.col !== daddyStart.col || daddy.row !== daddyStart.row) {
        ctx.fillText('DADDY', dx, dy);
    }
}

function drawToken(player) {
    const x = offsetX + player.col * cellSize + cellSize / 2;
    const y = offsetY + player.row * cellSize + cellSize / 2;
    const r = cellSize * 0.32;

    ctx.beginPath();
    ctx.arc(x, y, r + 4, 0, Math.PI * 2);
    ctx.fillStyle = player.border;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();

    ctx.font = `${Math.floor(cellSize * 0.5)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.emoji, x, y);
}

function draw() {
    layoutGrid();
    drawMaze();

    if (james.col === daddy.col && james.row === daddy.row) {
        drawToken(james);
        if (gameStarted) {
            ctx.font = `${Math.floor(cellSize * 0.35)}px Arial`;
            ctx.fillStyle = '#1a1a2e';
            ctx.fillText('👨', offsetX + daddy.col * cellSize + cellSize * 0.72, offsetY + daddy.row * cellSize + cellSize * 0.35);
        }
    } else {
        drawToken(daddy);
        drawToken(james);
    }

    if (!gameStarted) {
        ctx.fillStyle = 'rgba(26,26,46,0.55)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Press Start to play!', canvas.width / 2, canvas.height / 2);
    }

    if (gameOver && winner) {
        const w = getPlayer(winner);
        ctx.fillStyle = 'rgba(26,26,46,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${w.emoji} ${w.name} wins!`, canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '22px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText('Press Start for a new maze', canvas.width / 2, canvas.height / 2 + 30);
    }
}

function startGame() {
    clearAllHolds();
    generateMaze();
    resetPlayers();
    gameStarted = true;
    gameOver = false;
    winner = null;
    jamesWallsRemoved = 0;
    updateStatus(`Tap = 1 step. Hold arrow keys or W A S D for 0.2s to glide! James: Space (${JAMES_WALL_REMOVAL_LIMIT} smashes).`);
    canvas.focus();
    draw();
}

const jamesKeys = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right'
};

const daddyKeys = {
    w: 'up', W: 'up', s: 'down', S: 'down', a: 'left', A: 'left', d: 'right', D: 'right'
};

const HOLD_DELAY_MS = 200;
const MOVE_REPEAT_MS = 110;

const held = { james: null, daddy: null };
const holdTimers = { james: null, daddy: null };
const lastMoveAt = { james: 0, daddy: 0 };
let moveLoopId = null;

function keyToMove(key) {
    if (jamesKeys[key]) return { who: 'james', dir: jamesKeys[key] };
    if (daddyKeys[key]) return { who: 'daddy', dir: daddyKeys[key] };
    return null;
}

function clearPlayerHold(who) {
    if (holdTimers[who]) {
        clearTimeout(holdTimers[who]);
        holdTimers[who] = null;
    }
    held[who] = null;
}

function clearAllHolds() {
    clearPlayerHold('james');
    clearPlayerHold('daddy');
    if (moveLoopId !== null) {
        cancelAnimationFrame(moveLoopId);
        moveLoopId = null;
    }
}

function processHeldMoves() {
    if (!gameStarted || gameOver) return false;
    const now = performance.now();
    let moved = false;

    if (held.james && now - lastMoveAt.james >= MOVE_REPEAT_MS) {
        if (movePlayer('james', held.james)) moved = true;
        lastMoveAt.james = now;
    }
    if (held.daddy && now - lastMoveAt.daddy >= MOVE_REPEAT_MS) {
        if (movePlayer('daddy', held.daddy)) moved = true;
        lastMoveAt.daddy = now;
    }

    if (moved) draw();
    return moved;
}

function scheduleMoveLoop() {
    if (moveLoopId !== null) return;
    moveLoopId = requestAnimationFrame(tickMoveLoop);
}

function tickMoveLoop() {
    moveLoopId = null;
    if (!gameStarted || gameOver) return;
    if (!held.james && !held.daddy) return;

    processHeldMoves();

    if (gameStarted && !gameOver && (held.james || held.daddy)) {
        scheduleMoveLoop();
    }
}

function beginHoldMove(who, dir) {
    clearPlayerHold(who);
    held[who] = dir;
    lastMoveAt[who] = performance.now();

    if (movePlayer(who, dir)) draw();

    holdTimers[who] = setTimeout(() => {
        holdTimers[who] = null;
        if (held[who] === dir && gameStarted && !gameOver) {
            scheduleMoveLoop();
        }
    }, HOLD_DELAY_MS);
}

function handleKeyDown(e) {
    if (e.repeat) return;

    if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (!gameStarted || gameOver) return;
        if (jamesRemoveWall()) draw();
        return;
    }

    const isArrow = e.key.startsWith('Arrow');
    const isWasd = ['w', 'W', 'a', 'A', 's', 'S', 'd', 'D'].includes(e.key);
    if (isArrow || isWasd) e.preventDefault();

    if (!gameStarted || gameOver) return;

    const move = keyToMove(e.key);
    if (!move) return;

    beginHoldMove(move.who, move.dir);
}

function handleKeyUp(e) {
    const move = keyToMove(e.key);
    if (!move) return;

    if (held[move.who] === move.dir) {
        clearPlayerHold(move.who);
    }
    if (!held.james && !held.daddy && moveLoopId === null) {
        return;
    }
    if (!held.james && !held.daddy) {
        if (moveLoopId !== null) {
            cancelAnimationFrame(moveLoopId);
            moveLoopId = null;
        }
    }
}

canvas.addEventListener('click', () => canvas.focus());
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
window.addEventListener('blur', clearAllHolds);

generateMaze();
resetPlayers();
layoutGrid();
draw();
