// Let's Explore New Zealand - Drag-and-Drop City Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

// City data: name, x, y (adjusted for larger, wider map)
const cities = [
    { name: 'Auckland', x: 520, y: 200 },
    { name: 'Hamilton', x: 560, y: 270 },
    { name: 'Wellington', x: 670, y: 480 },
    { name: 'Christchurch', x: 850, y: 650 },
    { name: 'Queenstown', x: 760, y: 780 }, // moved onto land
    { name: 'Stewart Island', x: 850, y: 860 }
];

let discovered = Array(cities.length).fill(false);
let draggingName = null;
let dragOffset = { x: 0, y: 0 };
let dragPos = { x: 0, y: 0 };
let message = 'Drag the city names to the correct places on the map!';

// Setup draggable city names
const cityListDiv = document.getElementById('city-list');
function renderCityList() {
    cityListDiv.innerHTML = '';
    cities.forEach((city, idx) => {
        if (!discovered[idx]) {
            const btn = document.createElement('div');
            btn.textContent = city.name;
            btn.setAttribute('draggable', 'true');
            btn.style.background = '#e0ffe0';
            btn.style.border = '2px solid #00796b';
            btn.style.borderRadius = '10px';
            btn.style.padding = '0.5rem 1.2rem';
            btn.style.fontWeight = 'bold';
            btn.style.cursor = 'grab';
            btn.style.userSelect = 'none';
            btn.style.fontSize = '1.1rem';
            btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            btn.style.transition = 'background 0.2s';
            btn.addEventListener('dragstart', (e) => {
                draggingName = idx;
                dragOffset = { x: e.offsetX, y: e.offsetY };
            });
            btn.addEventListener('dragend', () => {
                draggingName = null;
            });
            cityListDiv.appendChild(btn);
        }
    });
}
renderCityList();

// Canvas drag-and-drop logic
canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
    dragPos = { x: e.offsetX, y: e.offsetY };
});
canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    if (draggingName !== null) {
        // Check if dropped near a city point
        for (let i = 0; i < cities.length; i++) {
            if (!discovered[i]) {
                const dx = e.offsetX - cities[i].x;
                const dy = e.offsetY - cities[i].y;
                if (Math.sqrt(dx * dx + dy * dy) < 30) {
                    if (draggingName === i) {
                        discovered[i] = true;
                        message = `Correct! ${cities[i].name} placed.`;
                        renderCityList();
                    } else {
                        message = `Oops! That's not the right city.`;
                    }
                    draggingName = null;
                    return;
                }
            }
        }
        message = 'Try dropping closer to a city point!';
        draggingName = null;
    }
});

function drawNZOutline() {
    ctx.save();
    ctx.strokeStyle = '#00796b';
    ctx.lineWidth = 5;
    // North Island (wider, more horizontal curves)
    ctx.beginPath();
    ctx.moveTo(420, 120);
    ctx.bezierCurveTo(500, 180, 650, 180, 700, 320);
    ctx.bezierCurveTo(740, 420, 700, 500, 670, 480);
    ctx.bezierCurveTo(600, 400, 500, 320, 520, 200);
    ctx.bezierCurveTo(500, 160, 440, 160, 420, 120);
    ctx.stroke();
    // South Island (wider, more horizontal curves)
    ctx.beginPath();
    ctx.moveTo(700, 520);
    ctx.bezierCurveTo(800, 600, 950, 650, 900, 800);
    ctx.bezierCurveTo(850, 870, 700, 850, 700, 700);
    ctx.bezierCurveTo(750, 650, 700, 600, 700, 520);
    ctx.stroke();
    // Stewart Island
    ctx.beginPath();
    ctx.arc(850, 860, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

function drawCities() {
    for (let i = 0; i < cities.length; i++) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cities[i].x, cities[i].y, 18, 0, Math.PI * 2);
        ctx.fillStyle = discovered[i] ? '#4caf50' : '#fff';
        ctx.fill();
        ctx.strokeStyle = '#00796b';
        ctx.lineWidth = 4;
        ctx.stroke();
        if (discovered[i]) {
            ctx.font = '20px Arial';
            ctx.fillStyle = '#00796b';
            ctx.textAlign = 'center';
            ctx.fillText(cities[i].name, cities[i].x, cities[i].y - 22);
        }
        ctx.restore();
    }
}

function drawDraggingName() {
    if (draggingName !== null && dragPos.x && dragPos.y) {
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#00796b';
        ctx.textAlign = 'center';
        ctx.fillText(cities[draggingName].name, dragPos.x, dragPos.y);
        ctx.restore();
    }
}

function drawMessage() {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, height - 60, width, 60);
    ctx.font = '28px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(message, width/2, height - 20);
    ctx.restore();
}

function render() {
    ctx.clearRect(0, 0, width, height);
    drawNZOutline();
    drawCities();
    drawDraggingName();
    drawMessage();
}

function gameLoop() {
    render();
    requestAnimationFrame(gameLoop);
}

gameLoop(); 