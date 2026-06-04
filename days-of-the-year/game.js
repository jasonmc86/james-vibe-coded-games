// The Days of the Year — journey through 12 months of calendar challenges

const MONTHS = [
    { name: 'January', short: 'Jan', days: 31, color: '#4a69bd', emoji: '❄️',
      special: { day: 1, label: "New Year's Day" } },
    { name: 'February', short: 'Feb', days: 28, color: '#8e44ad', emoji: '💜',
      special: { day: 6, label: 'Waitangi Day (NZ)' } },
    { name: 'March', short: 'Mar', days: 31, color: '#27ae60', emoji: '🍀',
      special: { day: 17, label: "St Patrick's Day" } },
    { name: 'April', short: 'Apr', days: 30, color: '#e67e22', emoji: '🌸',
      special: { day: 25, label: 'ANZAC Day' } },
    { name: 'May', short: 'May', days: 31, color: '#16a085', emoji: '🌷',
      special: { day: 4, label: 'May the 4th — Star Wars Day!' } },
    { name: 'June', short: 'Jun', days: 30, color: '#2980b9', emoji: '☀️',
      special: { day: 21, label: 'Winter Solstice (Southern)' } },
    { name: 'July', short: 'Jul', days: 31, color: '#c0392b', emoji: '🔥',
      special: { day: 4, label: 'Independence Day (USA)' } },
    { name: 'August', short: 'Aug', days: 31, color: '#d35400', emoji: '🌻',
      special: { day: 15, label: 'Mid-August — summer fun!' } },
    { name: 'September', short: 'Sep', days: 30, color: '#f39c12', emoji: '🍂',
      special: { day: 23, label: 'Spring Equinox (Southern)' } },
    { name: 'October', short: 'Oct', days: 31, color: '#e17055', emoji: '🎃',
      special: { day: 31, label: 'Halloween' } },
    { name: 'November', short: 'Nov', days: 30, color: '#6c5ce7', emoji: '🦃',
      special: { day: 5, label: 'Guy Fawkes Night' } },
    { name: 'December', short: 'Dec', days: 31, color: '#00b894', emoji: '🎄',
      special: { day: 25, label: 'Christmas Day' } }
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

let monthIndex = 0;
let challengeIndex = 0;
let stars = 0;
let answered = false;

const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const winScreen = document.getElementById('winScreen');
const monthBanner = document.getElementById('monthBanner');
const questionText = document.getElementById('questionText');
const questionBody = document.getElementById('questionBody');
const feedbackEl = document.getElementById('feedback');
const nextRow = document.getElementById('nextRow');
const progressFill = document.getElementById('progressFill');
const monthLabel = document.getElementById('monthLabel');
const starLabel = document.getElementById('starLabel');

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('nextBtn').addEventListener('click', advanceChallenge);
document.getElementById('playAgainBtn').addEventListener('click', () => {
    winScreen.style.display = 'none';
    startScreen.style.display = 'block';
    startGame();
});

function startGame() {
    monthIndex = 0;
    challengeIndex = 0;
    stars = 0;
    startScreen.style.display = 'none';
    winScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    updateHud();
    loadChallenge();
}

function updateHud() {
    monthLabel.textContent = `Month ${monthIndex + 1} / 12`;
    starLabel.textContent = `⭐ ${stars}`;
    const totalChallenges = 12 * 3;
    const done = monthIndex * 3 + challengeIndex;
    progressFill.style.width = `${(done / totalChallenges) * 100}%`;
}

function getMonth() {
    return MONTHS[monthIndex];
}

function loadChallenge() {
    answered = false;
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';
    nextRow.classList.remove('visible');

    const m = getMonth();
    monthBanner.textContent = `${m.emoji} ${m.name} ${m.emoji}`;
    monthBanner.style.background = `linear-gradient(135deg, ${m.color}88, ${m.color}44)`;

    const types = ['count', 'find', 'order'];
    const type = types[challengeIndex];

    if (type === 'count') {
        setupCountChallenge(m);
    } else if (type === 'find') {
        setupFindChallenge(m);
    } else {
        setupOrderChallenge(m);
    }
    updateHud();
}

function setupCountChallenge(m) {
    questionText.textContent = `How many days are in ${m.name}?`;
    const correct = m.days;
    const wrong = shuffle([
        correct === 28 ? 29 : 28,
        correct === 30 ? 31 : 30,
        correct === 31 ? 30 : 31
    ].filter((d) => d !== correct)).slice(0, 2);
    const options = shuffle([correct, ...wrong]);

    questionBody.innerHTML = '<div class="choices"></div>';
    const choices = questionBody.querySelector('.choices');
    options.forEach((n) => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = `${n} days`;
        btn.addEventListener('click', () => pickCount(btn, n === correct));
        choices.appendChild(btn);
    });
}

function pickCount(btn, correct) {
    if (answered) return;
    answered = true;
    disableChoices();
    if (correct) {
        btn.classList.add('correct');
        stars++;
        showOk('Correct! ⭐');
    } else {
        btn.classList.add('wrong');
        highlightCorrectCount();
        showNo(`Not quite — ${getMonth().name} has ${getMonth().days} days.`);
    }
    showNext();
}

function highlightCorrectCount() {
    const m = getMonth();
    questionBody.querySelectorAll('.choice-btn').forEach((b) => {
        if (b.textContent === `${m.days} days`) b.classList.add('correct');
    });
}

function setupFindChallenge(m) {
    const { day, label } = m.special;
    questionText.textContent = `Tap the day for: ${label}`;
    questionBody.innerHTML = buildCalendarHtml(m, day);
    questionBody.querySelectorAll('.cal-day:not(.empty)').forEach((el) => {
        el.addEventListener('click', () => {
            const d = parseInt(el.dataset.day, 10);
            tapDay(el, d === day);
        });
    });
}

function buildCalendarHtml(m, targetDay) {
    // Simple calendar: month starts on a rotating weekday for variety
    const startOffset = monthIndex % 7;
    let html = '<div class="calendar-grid">';
    DAY_NAMES.forEach((d) => {
        html += `<div class="cal-header">${d}</div>`;
    });
    for (let i = 0; i < startOffset; i++) {
        html += '<div class="cal-day empty"></div>';
    }
    for (let d = 1; d <= m.days; d++) {
        html += `<div class="cal-day" data-day="${d}">${d}</div>`;
    }
    html += '</div>';
    return html;
}

function tapDay(el, correct) {
    if (answered) return;
    if (el.classList.contains('found') || el.classList.contains('wrong-flash')) return;

    if (correct) {
        answered = true;
        el.classList.add('found');
        stars++;
        showOk(`Found it! ${getMonth().special.label} ⭐`);
        showNext();
    } else {
        el.classList.add('wrong-flash');
        setTimeout(() => el.classList.remove('wrong-flash'), 400);
        showNo('Try another day!');
    }
}

function setupOrderChallenge(m) {
    questionText.textContent = 'Put these months in calendar order (earliest first):';
    const idx = monthIndex;
    const trio = [
        MONTHS[(idx + 11) % 12],
        MONTHS[idx],
        MONTHS[(idx + 1) % 12],
        MONTHS[(idx + 5) % 12]
    ];
    const unique = [];
    trio.forEach((t) => {
        if (!unique.find((u) => u.name === t.name)) unique.push(t);
    });
    while (unique.length < 4) {
        const extra = MONTHS[(idx + unique.length + 3) % 12];
        if (!unique.find((u) => u.name === extra.name)) unique.push(extra);
    }
    const pool = shuffle(unique.slice(0, 4));
    const correctOrder = [...pool].sort(
        (a, b) => MONTHS.findIndex((x) => x.name === a.name) - MONTHS.findIndex((x) => x.name === b.name)
    );

    questionBody.innerHTML = `
        <div class="order-zone" id="orderSlots"></div>
        <div class="order-pool" id="orderPool"></div>
        <button class="btn btn-secondary" id="checkOrderBtn" style="width:100%;">Check order</button>
    `;

    const slots = document.getElementById('orderSlots');
    const poolEl = document.getElementById('orderPool');

    pool.forEach((item) => {
        const chip = document.createElement('span');
        chip.className = 'order-chip';
        chip.textContent = item.short;
        chip.dataset.name = item.name;
        chip.draggable = true;
        chip.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', item.name);
        });
        chip.addEventListener('click', () => {
            if (answered) return;
            const empty = [...slots.querySelectorAll('.order-chip')].find((s) => !s.dataset.name);
            if (empty) fillSlot(empty, item.name, poolEl, slots);
            else moveChipToPool(chip);
        });
        poolEl.appendChild(chip);
    });

    for (let i = 0; i < 4; i++) {
        const slot = document.createElement('span');
        slot.className = 'order-chip in-slot';
        slot.textContent = '—';
        slot.dataset.slot = i;
        slot.addEventListener('dragover', (e) => e.preventDefault());
        slot.addEventListener('drop', (e) => {
            e.preventDefault();
            const name = e.dataTransfer.getData('text/plain');
            if (name) fillSlot(slot, name, poolEl, slots);
        });
        slot.addEventListener('click', () => {
            if (slot.dataset.name) moveChipToPool(slot);
        });
        slots.appendChild(slot);
    }

    document.getElementById('checkOrderBtn').addEventListener('click', () => {
        if (answered) return;
        const names = [...slots.querySelectorAll('[data-name]')].map((s) => s.dataset.name);
        if (names.length < 4) {
            showNo('Fill all four slots first!');
            return;
        }
        answered = true;
        const ok = names.every((n, i) => n === correctOrder[i].name);
        if (ok) {
            stars++;
            showOk('Perfect order! ⭐');
        } else {
            showNo(`Correct order: ${correctOrder.map((c) => c.short).join(' → ')}`);
        }
        showNext();
    });
}

function fillSlot(slot, name, poolEl, slotsContainer) {
    if (answered) return;
    const existing = poolEl.querySelector(`[data-name="${name}"]`) ||
        slotsContainer.querySelector(`[data-name="${name}"]:not([data-slot])`);
    if (slot.dataset.name) {
        const old = slot.dataset.name;
        const oldChip = document.createElement('span');
        oldChip.className = 'order-chip';
        oldChip.textContent = MONTHS.find((x) => x.name === old).short;
        oldChip.dataset.name = old;
        oldChip.draggable = true;
        oldChip.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', old);
        });
        oldChip.addEventListener('click', () => moveChipToPool(oldChip));
        poolEl.appendChild(oldChip);
    }
    const m = MONTHS.find((x) => x.name === name);
    slot.textContent = m.short;
    slot.dataset.name = name;
    slot.classList.add('in-slot');
    const src = poolEl.querySelector(`[data-name="${name}"]`) ||
        [...slotsContainer.querySelectorAll('.order-chip')].find((c) => c.dataset.name === name && c !== slot);
    if (src && src.parentElement === poolEl) src.remove();
    else if (src && src !== slot) {
        src.textContent = '—';
        delete src.dataset.name;
    }
}

function moveChipToPool(chip) {
    if (answered || !chip.dataset.name) return;
    const name = chip.dataset.name;
    const m = MONTHS.find((x) => x.name === name);
    const poolEl = document.getElementById('orderPool');
    if (chip.dataset.slot !== undefined) {
        chip.textContent = '—';
        delete chip.dataset.name;
    } else {
        chip.remove();
    }
    const newChip = document.createElement('span');
    newChip.className = 'order-chip';
    newChip.textContent = m.short;
    newChip.dataset.name = name;
    newChip.draggable = true;
    newChip.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', name);
    });
    newChip.addEventListener('click', () => moveChipToPool(newChip));
    poolEl.appendChild(newChip);
}

function disableChoices() {
    questionBody.querySelectorAll('.choice-btn').forEach((b) => {
        b.disabled = true;
    });
}

function showOk(msg) {
    feedbackEl.textContent = msg;
    feedbackEl.className = 'feedback ok';
    starLabel.textContent = `⭐ ${stars}`;
}

function showNo(msg) {
    feedbackEl.textContent = msg;
    feedbackEl.className = 'feedback no';
}

function showNext() {
    nextRow.classList.add('visible');
}

function advanceChallenge() {
    challengeIndex++;
    if (challengeIndex >= 3) {
        challengeIndex = 0;
        monthIndex++;
        if (monthIndex >= 12) {
            endGame();
            return;
        }
    }
    loadChallenge();
}

function endGame() {
    gameScreen.style.display = 'none';
    winScreen.style.display = 'block';
    progressFill.style.width = '100%';

    const maxStars = 36;
    let emojiStars = '';
    const rating = stars / maxStars;
    if (rating >= 0.9) emojiStars = '⭐⭐⭐';
    else if (rating >= 0.6) emojiStars = '⭐⭐';
    else emojiStars = '⭐';

    document.getElementById('finalStars').textContent = emojiStars;
    document.getElementById('winMessage').textContent =
        `You finished all 365 days of adventure across 12 months and earned ${stars} out of ${maxStars} stars. ` +
        (stars >= 30 ? 'Calendar champion!' : 'Play again to collect more stars!');
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
