// James's Drawing Game
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');
const modeHint = document.getElementById('modeHint');

// Drawing state
let isDrawing = false;
let currentColor = '#e74c3c';
let brushSize = 12;
let isEraser = false;

// Space bar: first press = tick ON on colour, second press = tick OFF. When tick is OFF, arrow keys draw.
let activationMarkVisible = false;

// Arrow-key drawing: cursor position (when tick is off, arrow keys move this and draw)
let cursorX = canvas.width / 2;
let cursorY = canvas.height / 2;
const moveStep = 10;

// Kid-friendly colours
const colors = [
    '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db',
    '#9b59b6', '#e91e63', '#000000', '#ffffff'
];

// Build colour palette
const colorPalette = document.getElementById('colorPalette');
const colorWrappers = [];
colors.forEach((color, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'color-btn-wrapper';
    const btn = document.createElement('button');
    btn.className = 'color-btn' + (color === currentColor ? ' active' : '');
    btn.style.backgroundColor = color;
    if (color === '#ffffff') btn.style.border = '2px solid #ccc';
    btn.setAttribute('data-color', color);
    btn.setAttribute('data-index', index);
    btn.setAttribute('aria-label', 'Color ' + color);
    btn.addEventListener('click', () => selectColor(color));
    const mark = document.createElement('span');
    mark.className = 'activation-mark';
    mark.textContent = '✓';
    mark.setAttribute('aria-hidden', 'true');
    wrapper.appendChild(btn);
    wrapper.appendChild(mark);
    colorPalette.appendChild(wrapper);
    colorWrappers.push({ wrapper, btn, mark });
});

let currentColorIndex = 0;

function selectColor(color) {
    currentColor = color;
    isEraser = false;
    currentColorIndex = colors.indexOf(color);
    if (currentColorIndex === -1) currentColorIndex = 0;
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-color') === color);
    });
    document.getElementById('eraserBtn').classList.remove('active');
}

function setBrushSize(size) {
    brushSize = size;
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.getAttribute('data-size'), 10) === brushSize);
    });
}

// Show tick on current colour (hop + mark)
function showActivationMark() {
    if (isEraser) return;
    const activeWrapper = colorWrappers.find(w => w.btn.classList.contains('active'));
    if (!activeWrapper) return;
    const { btn, mark } = activeWrapper;
    btn.classList.add('activated');
    mark.classList.add('show');
    setTimeout(() => btn.classList.remove('activated'), 400);
}

// Hide tick on current colour
function hideActivationMark() {
    colorWrappers.forEach(({ mark }) => mark.classList.remove('show'));
}

// Space bar: first press = tick ON, second press = tick OFF
function onSpaceBar() {
    if (isEraser) return;
    activationMarkVisible = !activationMarkVisible;
    if (activationMarkVisible) {
        showActivationMark();
        modeHint.textContent = 'Tick is on! Press Space again to hide tick, then use arrow keys to draw.';
    } else {
        hideActivationMark();
        modeHint.textContent = 'Tick is off. Use arrow keys to draw on the picture!';
    }
}

// Draw a line from (cursorX, cursorY) to (newX, newY) with current colour/size
function drawWithArrowKeys(newX, newY) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    if (isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = currentColor;
    }
    ctx.beginPath();
    ctx.moveTo(cursorX, cursorY);
    ctx.lineTo(newX, newY);
    ctx.stroke();
    cursorX = newX;
    cursorY = newY;
}

// Brush size buttons
document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        setBrushSize(parseInt(btn.getAttribute('data-size'), 10));
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

document.getElementById('eraserBtn').addEventListener('click', () => {
    isEraser = !isEraser;
    document.getElementById('eraserBtn').classList.toggle('active', isEraser);
    if (isEraser) {
        document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
        hideActivationMark();
        activationMarkVisible = false;
    }
});

document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm('Clear the whole drawing?')) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        cursorX = canvas.width / 2;
        cursorY = canvas.height / 2;
    }
});

// White canvas to start
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);

function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
        return {
            x: (e.touches[0].clientX - rect.left) * scaleX,
            y: (e.touches[0].clientY - rect.top) * scaleY
        };
    }
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function startDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

function draw(x, y) {
    if (!isDrawing) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    if (isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = currentColor;
    }
    ctx.lineTo(x, y);
    ctx.stroke();
}

function stopDrawing(e) {
    e.preventDefault();
    isDrawing = false;
    ctx.beginPath();
}

// Mouse
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        e.preventDefault();
        const pos = getPos(e);
        draw(pos.x, pos.y);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }
});
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);

// Touch
canvas.addEventListener('touchstart', startDrawing, { passive: false });
canvas.addEventListener('touchmove', (e) => {
    if (isDrawing) {
        e.preventDefault();
        const pos = getPos(e);
        draw(pos.x, pos.y);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }
}, { passive: false });
canvas.addEventListener('touchend', stopDrawing, { passive: false });
canvas.addEventListener('touchcancel', stopDrawing, { passive: false });

// Keyboard: Space = toggle tick. When tick ON: arrows change colour/size. When tick OFF: arrows draw.
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.code === 'Space') {
        e.preventDefault();
        onSpaceBar();
        return;
    }

    // When tick is OFF: arrow keys move cursor and draw
    if (!activationMarkVisible) {
        let didDraw = false;
        if (e.code === 'ArrowLeft') {
            e.preventDefault();
            const newX = Math.max(0, cursorX - moveStep);
            drawWithArrowKeys(newX, cursorY);
            didDraw = true;
        }
        if (e.code === 'ArrowRight') {
            e.preventDefault();
            const newX = Math.min(canvas.width, cursorX + moveStep);
            drawWithArrowKeys(newX, cursorY);
            didDraw = true;
        }
        if (e.code === 'ArrowUp') {
            e.preventDefault();
            const newY = Math.max(0, cursorY - moveStep);
            drawWithArrowKeys(cursorX, newY);
            didDraw = true;
        }
        if (e.code === 'ArrowDown') {
            e.preventDefault();
            const newY = Math.min(canvas.height, cursorY + moveStep);
            drawWithArrowKeys(cursorX, newY);
            didDraw = true;
        }
        if (didDraw) return;
    }

    // When tick is ON: arrow keys change colour and brush size
    if (activationMarkVisible) {
        if (e.code === 'ArrowLeft') {
            e.preventDefault();
            currentColorIndex = (currentColorIndex - 1 + colors.length) % colors.length;
            selectColor(colors[currentColorIndex]);
        }
        if (e.code === 'ArrowRight') {
            e.preventDefault();
            currentColorIndex = (currentColorIndex + 1) % colors.length;
            selectColor(colors[currentColorIndex]);
        }
        if (e.code === 'ArrowUp') {
            e.preventDefault();
            if (brushSize === 4) setBrushSize(12);
            else if (brushSize === 12) setBrushSize(24);
        }
        if (e.code === 'ArrowDown') {
            e.preventDefault();
            if (brushSize === 24) setBrushSize(12);
            else if (brushSize === 12) setBrushSize(4);
        }
    }
});
