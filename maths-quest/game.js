const levels = [
    {
        id: 'numbers',
        icon: '🔢',
        name: 'Numbers',
        short: 'Count and read',
        guide: '🧑‍🚀',
        badge: '🔢',
        color: '#246bfe',
        target: 8
    },
    {
        id: 'addition',
        icon: '➕',
        name: 'Addition',
        short: 'Join groups',
        guide: '🧙',
        badge: '➕',
        color: '#13a86b',
        target: 8
    },
    {
        id: 'subtraction',
        icon: '➖',
        name: 'Subtraction',
        short: 'Take away',
        guide: '🦸',
        badge: '➖',
        color: '#ef476f',
        target: 8
    },
    {
        id: 'hard',
        icon: '💎',
        name: 'Hard Ones',
        short: 'Missing numbers',
        guide: '🕵️',
        badge: '💎',
        color: '#7d4cff',
        target: 10
    },
    {
        id: 'multiplication',
        icon: '✖️',
        name: 'Multiply',
        short: 'Equal groups',
        guide: '🚀',
        badge: '✖️',
        color: '#f59f00',
        target: 8
    }
];

const praise = [
    'Brilliant thinking!',
    'You powered up your maths brain!',
    'Yes! That is the one.',
    'Great counting.',
    'Sharp work!'
];

const state = {
    levelIndex: 0,
    round: 1,
    score: 0,
    streak: 0,
    stars: 0,
    spice: 1,
    selected: null,
    currentQuestion: null,
    mastery: levels.reduce((map, level) => {
        map[level.id] = 0;
        return map;
    }, {})
};

const els = {
    tabs: document.getElementById('levelTabs'),
    guideFace: document.getElementById('guideFace'),
    visualModel: document.getElementById('visualModel'),
    missionPill: document.getElementById('missionPill'),
    roundCount: document.getElementById('roundCount'),
    questionText: document.getElementById('questionText'),
    mathSentence: document.getElementById('mathSentence'),
    optionsGrid: document.getElementById('optionsGrid'),
    feedback: document.getElementById('feedback'),
    hintBtn: document.getElementById('hintBtn'),
    nextBtn: document.getElementById('nextBtn'),
    scoreValue: document.getElementById('scoreValue'),
    streakValue: document.getElementById('streakValue'),
    starsValue: document.getElementById('starsValue'),
    masteryList: document.getElementById('masteryList'),
    badges: document.getElementById('badges')
};

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = randomInt(0, i);
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function uniqueOptions(answer, min, max, spread = 5) {
    const values = new Set([answer]);
    while (values.size < 4) {
        const low = Math.max(min, answer - spread);
        const high = Math.min(max, answer + spread);
        values.add(randomInt(low, high));
    }
    return shuffle([...values]);
}

function getSkillPower(levelId) {
    return state.mastery[levelId];
}

function getSpiceLevel(levelId) {
    const power = getSkillPower(levelId);
    const roundBoost = Math.floor((state.round - 1) / 2);
    const streakBoost = Math.floor(state.streak / 2);
    return Math.max(1, 1 + Math.floor(power / 2) + roundBoost + streakBoost);
}

function makeQuestion() {
    const level = levels[state.levelIndex];
    const skillPower = getSkillPower(level.id);
    const spice = getSpiceLevel(level.id);

    if (level.id === 'numbers') {
        return makeNumberQuestion(skillPower, spice);
    }

    if (level.id === 'addition') {
        return makeAdditionQuestion(skillPower, spice);
    }

    if (level.id === 'subtraction') {
        return makeSubtractionQuestion(skillPower, spice);
    }

    if (level.id === 'hard') {
        return makeHardQuestion(skillPower, spice);
    }

    return makeMultiplicationQuestion(skillPower, spice);
}

function makeNumberQuestion(power, spice) {
    const max = spice > 7 ? 120 : spice > 5 ? 80 : spice > 3 ? 40 : 20;
    const mode = spice > 4
        ? ['count', 'beforeAfter', 'skip', 'place'][randomInt(0, 3)]
        : Math.random() < 0.5 ? 'count' : 'beforeAfter';

    if (mode === 'skip') {
        const step = [2, 5, 10][randomInt(0, 2)];
        const start = step === 10 ? randomInt(0, 6) * 10 : randomInt(0, 6) * step;
        const answer = start + step * 4;
        return {
            type: 'story',
            prompt: `What number comes next: ${start}, ${start + step}, ${start + step * 2}, ${start + step * 3}, ?`,
            sentence: [start, '...', '?'],
            answer,
            options: uniqueOptions(answer, 0, max + 20, step * 3),
            hint: `The pattern is counting by ${step}s.`,
            explain: `Each jump is ${step}, so the next number is ${answer}.`,
            data: { text: `Count by ${step}: ${start}, ${start + step}, ${start + step * 2}, ${start + step * 3}, ${answer}` }
        };
    }

    if (mode === 'place') {
        const answer = randomInt(10, max);
        const tens = Math.floor(answer / 10) * 10;
        const ones = answer % 10;
        return {
            type: 'story',
            prompt: `Which number has ${Math.floor(answer / 10)} tens and ${ones} ones?`,
            sentence: [Math.floor(answer / 10), 'tens', '+', ones, 'ones'],
            answer,
            options: uniqueOptions(answer, 10, max + 10, 12),
            hint: `Put the tens and ones together.`,
            explain: `${Math.floor(answer / 10)} tens is ${tens}, and ${ones} ones makes ${answer}.`,
            data: { text: `${Math.floor(answer / 10)} tens = ${tens}. Then add ${ones} ones.` }
        };
    }

    const answer = randomInt(1, max);
    const modeTwo = Math.random() < 0.5 ? 'count' : 'beforeAfter';

    if (modeTwo === 'beforeAfter' && answer > 2) {
        const missing = Math.random() < 0.5 ? answer - 1 : answer + 1;
        const prompt = missing < answer
            ? `What number comes before ${answer}?`
            : `What number comes after ${answer}?`;
        return {
            type: 'line',
            prompt,
            sentence: [missing < answer ? '?' : answer, missing < answer ? answer : '?'],
            answer: missing,
            options: uniqueOptions(missing, 0, max + 2, 4),
            hint: `Count ${missing < answer ? 'back one step' : 'forward one step'} from ${answer}.`,
            explain: `${missing} is right next to ${answer} on the number line.`,
            data: { start: Math.max(0, answer - 4), end: Math.min(max + 2, answer + 4), jumps: [] }
        };
    }

    return {
        type: 'tokens',
        prompt: spice > 4 ? 'How many treasure dots can you count fast?' : 'How many treasure dots can you count?',
        sentence: ['Count', '?'],
        answer,
        options: uniqueOptions(answer, 1, max, spice > 4 ? 8 : 5),
        hint: 'Touch each dot with your eyes and count one number for each dot.',
        explain: `There are ${answer} dots. The last number you say is the answer.`,
        data: { count: answer, frame: answer <= 20 }
    };
}

function makeAdditionQuestion(power, spice) {
    if (spice > 6) {
        const a = randomInt(15, 59);
        const b = randomInt(6, 28);
        const answer = a + b;
        return {
            type: 'line',
            prompt: `Super spicy: what is ${a} + ${b}?`,
            sentence: [a, '+', b, '=', '?'],
            answer,
            options: uniqueOptions(answer, 10, 99, 10),
            hint: `Add in parts. You can jump to the next ten first.`,
            explain: `${a} plus ${b} equals ${answer}. Breaking ${b} into smaller jumps can help.`,
            data: { a, b, start: Math.max(0, a - 5), end: Math.min(100, answer + 4), jumps: [{ from: a, size: b }] }
        };
    }

    if (spice > 4) {
        const a = randomInt(5, 19);
        const b = randomInt(4, 16);
        const c = randomInt(2, 9);
        const answer = a + b + c;
        return {
            type: 'story',
            prompt: `Can you add three numbers: ${a} + ${b} + ${c}?`,
            sentence: [a, '+', b, '+', c, '=', '?'],
            answer,
            options: uniqueOptions(answer, 6, 60, 8),
            hint: `Add two numbers first, then add the last one.`,
            explain: `${a} + ${b} + ${c} = ${answer}.`,
            data: { text: `Try ${a} + ${b} first, then add ${c}.` }
        };
    }

    const maxPart = power > 5 ? 15 : power > 2 ? 10 : 6;
    const a = randomInt(1, maxPart);
    const b = randomInt(1, maxPart);
    const answer = a + b;

    return {
        type: power > 3 ? 'line' : 'groups',
        prompt: `What is ${a} + ${b}?`,
        sentence: [a, '+', b, '=', '?'],
        answer,
        options: uniqueOptions(answer, 2, maxPart * 2, 6),
        hint: `Start at ${a}, then count on ${b} more.`,
        explain: `${a} plus ${b} makes ${answer}. You can count on: ${a} ... ${answer}.`,
        data: { a, b, start: 0, end: Math.max(12, answer + 2), jumps: [{ from: a, size: b }] }
    };
}

function makeSubtractionQuestion(power, spice) {
    if (spice > 6) {
        const total = randomInt(30, 90);
        const take = randomInt(8, 29);
        const answer = total - take;
        return {
            type: 'line',
            prompt: `Super spicy: what is ${total} - ${take}?`,
            sentence: [total, '-', take, '=', '?'],
            answer,
            options: uniqueOptions(answer, 0, 99, 10),
            hint: `Count back in chunks, like 10 and then the extra ones.`,
            explain: `${total} minus ${take} equals ${answer}.`,
            data: { start: Math.max(0, answer - 6), end: total + 2, jumps: [{ from: answer, size: take, backward: true }] }
        };
    }

    if (spice > 4) {
        const answer = randomInt(5, 25);
        const take = randomInt(3, 12);
        const total = answer + take;
        return {
            type: 'story',
            prompt: `Find the missing number: ${total} - ? = ${answer}`,
            sentence: [total, '-', '?', '=', answer],
            answer: take,
            options: uniqueOptions(take, 1, 20, 6),
            hint: `Ask: what must be taken away from ${total} to leave ${answer}?`,
            explain: `You subtract ${take} from ${total} to get ${answer}.`,
            data: { text: `Think up instead: ${answer} + ? = ${total}.` }
        };
    }

    const maxTotal = power > 5 ? 24 : power > 2 ? 18 : 12;
    const total = randomInt(4, maxTotal);
    const take = randomInt(1, Math.min(total - 1, power > 4 ? 12 : 8));
    const answer = total - take;

    return {
        type: 'takeaway',
        prompt: `What is ${total} - ${take}?`,
        sentence: [total, '-', take, '=', '?'],
        answer,
        options: uniqueOptions(answer, 0, maxTotal, 6),
        hint: `Start with ${total}. Take away ${take}. Count what is left.`,
        explain: `${total} take away ${take} leaves ${answer}.`,
        data: { total, take }
    };
}

function makeHardQuestion(power, spice) {
    const mode = spice % 5;

    if (mode === 0) {
        const a = randomInt(8, spice > 6 ? 30 : 16);
        const answer = randomInt(3, spice > 6 ? 18 : 10);
        const total = a + answer;
        return {
            type: 'story',
            prompt: `Find the missing number: ${a} + ? = ${total}`,
            sentence: [a, '+', '?', '=', total],
            answer,
            options: uniqueOptions(answer, 1, 12, 5),
            hint: `Ask: what do I add to ${a} to reach ${total}?`,
            explain: `${a} needs ${answer} more to reach ${total}.`,
            data: { text: `Start at ${a}. Count up to ${total}. How many jumps?` }
        };
    }

    if (mode === 1) {
        const tens = randomInt(2, spice > 6 ? 8 : 4) * 10;
        const ones = randomInt(2, 9);
        const add = randomInt(2, spice > 6 ? 15 : 9);
        const answer = tens + ones + add;
        return {
            type: 'story',
            prompt: `Try a bigger one: ${tens + ones} + ${add}`,
            sentence: [tens + ones, '+', add, '=', '?'],
            answer,
            options: uniqueOptions(answer, 10, 99, 8),
            hint: `Keep the ${tens}, then add ${ones} + ${add}.`,
            explain: `${ones} + ${add} = ${ones + add}, so ${tens + ones} + ${add} = ${answer}.`,
            data: { text: `Break it up: ${tens} + ${ones} + ${add}` }
        };
    }

    if (mode === 2) {
        const left = randomInt(3, 12);
        const right = randomInt(3, 12);
        const answer = left + right;
        const bonus = randomInt(4, spice > 6 ? 18 : 10);
        return {
            type: 'story',
            prompt: `Balance puzzle: ? - ${left} = ${right}`,
            sentence: ['?', '-', left, '=', right],
            answer,
            options: uniqueOptions(answer, 2, 30, 7),
            hint: `Add the two numbers on the right side together.`,
            explain: `If ? - ${left} = ${right}, then ? = ${left} + ${right} = ${answer}.`,
            data: { text: `Check it: ${answer} - ${left} = ${right}.` }
        };
    }

    if (mode === 3) {
        const a = randomInt(6, 14);
        const b = randomInt(6, 14);
        const c = randomInt(3, 12);
        const answer = a + b - c;
        return {
            type: 'story',
            prompt: `Mixed maths: ${a} + ${b} - ${c}`,
            sentence: [a, '+', b, '-', c, '=', '?'],
            answer,
            options: uniqueOptions(answer, 1, 30, 6),
            hint: `Add first, then subtract.`,
            explain: `${a} + ${b} = ${a + b}, then ${a + b} - ${c} = ${answer}.`,
            data: { text: `First add ${a} and ${b}. Then take away ${c}.` }
        };
    }

    const total = randomInt(20, spice > 6 ? 60 : 35);
    const take = randomInt(4, spice > 6 ? 20 : 12);
    const answer = total - take;
    return {
        type: 'line',
        prompt: `Try a bigger takeaway: ${total} - ${take}`,
        sentence: [total, '-', take, '=', '?'],
        answer,
        options: uniqueOptions(answer, 0, 65, 8),
        hint: `Count back ${take} steps from ${total}.`,
        explain: `Counting back ${take} from ${total} lands on ${answer}.`,
        data: { start: Math.max(0, answer - 3), end: total + 2, jumps: [{ from: answer, size: take, backward: true }] }
    };
}

function makeMultiplicationQuestion(power, spice) {
    const allowed = spice > 6 ? [2, 3, 4, 5, 6, 8, 10] : power > 5 ? [2, 3, 4, 5, 10] : power > 2 ? [2, 3, 5, 10] : [2, 5, 10];
    const groups = allowed[randomInt(0, allowed.length - 1)];
    const each = randomInt(2, spice > 6 ? 10 : power > 5 ? 8 : 5);
    const answer = groups * each;

    if (spice > 5 && Math.random() < 0.5) {
        return {
            type: 'story',
            prompt: `Which answer matches ${groups} × ${each}?`,
            sentence: [groups, '×', each, '=', '?'],
            answer,
            options: uniqueOptions(answer, 2, 100, Math.max(10, each + groups)),
            hint: `Think of ${groups} equal groups, or repeated addition.`,
            explain: `${groups} groups of ${each} makes ${answer}.`,
            data: { text: `${groups} × ${each} = ${each}${groups > 1 ? ` + ${each}`.repeat(groups - 1) : ''}` }
        };
    }

    return {
        type: 'array',
        prompt: spice > 6 ? `Super spicy: ${groups} groups of ${each} is how many?` : `${groups} groups of ${each} is how many?`,
        sentence: [groups, '×', each, '=', '?'],
        answer,
        options: uniqueOptions(answer, 2, 100, Math.max(8, each + groups)),
        hint: `Add ${each}, ${groups} times.`,
        explain: `${groups} equal groups of ${each} makes ${answer}. That is ${groups} × ${each}.`,
        data: { groups, each }
    };
}

function renderTabs() {
    els.tabs.innerHTML = '';
    levels.forEach((level, index) => {
        const button = document.createElement('button');
        button.className = `level-tab${index === state.levelIndex ? ' active' : ''}`;
        button.type = 'button';
        button.innerHTML = `<span>${level.icon}</span><strong>${level.name}<small>${level.short}</small></strong>`;
        button.addEventListener('click', () => chooseLevel(index));
        els.tabs.appendChild(button);
    });
}

function renderMastery() {
    els.masteryList.innerHTML = '';
    levels.forEach((level) => {
        const item = document.createElement('div');
        item.className = 'mastery-item';
        const progress = Math.min(100, Math.round((state.mastery[level.id] / level.target) * 100));
        item.innerHTML = `
            <div class="mastery-label">
                <span>${level.icon} ${level.name}</span>
                <span>${progress}%</span>
            </div>
            <div class="meter"><div class="meter-fill" style="width: ${progress}%"></div></div>
        `;
        els.masteryList.appendChild(item);
    });

    els.badges.innerHTML = '';
    levels.forEach((level) => {
        const badge = document.createElement('div');
        badge.className = `badge${state.mastery[level.id] >= level.target ? ' earned' : ''}`;
        badge.textContent = level.badge;
        badge.title = `${level.name} badge`;
        els.badges.appendChild(badge);
    });
}

function chooseLevel(index) {
    state.levelIndex = index;
    state.round = 1;
    state.streak = 0;
    renderTabs();
    nextQuestion();
}

function nextQuestion() {
    const level = levels[state.levelIndex];
    state.selected = null;
    state.spice = getSpiceLevel(level.id);
    state.currentQuestion = makeQuestion();

    els.guideFace.textContent = level.guide;
    els.missionPill.textContent = `${level.icon} ${level.name}`;
    els.missionPill.style.background = level.color;
    els.roundCount.textContent = `Round ${state.round} | Spice ${state.spice}`;
    els.questionText.textContent = state.currentQuestion.prompt;
    els.feedback.className = 'feedback';
    els.feedback.textContent = 'Choose an answer.';
    els.nextBtn.disabled = true;
    els.hintBtn.disabled = false;

    renderSentence();
    renderVisual();
    renderOptions();
    renderScore();
}

function renderSentence() {
    els.mathSentence.innerHTML = '';
    state.currentQuestion.sentence.forEach((part) => {
        const span = document.createElement('span');
        span.className = `math-chip${part === '?' ? ' answer-blank' : ''}`;
        span.textContent = part;
        els.mathSentence.appendChild(span);
    });
}

function renderOptions() {
    els.optionsGrid.innerHTML = '';
    state.currentQuestion.options.forEach((value) => {
        const button = document.createElement('button');
        button.className = 'answer-btn';
        button.type = 'button';
        button.textContent = value;
        button.addEventListener('click', () => checkAnswer(value, button));
        els.optionsGrid.appendChild(button);
    });
}

function renderVisual() {
    const question = state.currentQuestion;
    els.visualModel.innerHTML = '';

    if (question.type === 'tokens') {
        renderTokens(question.data.count, question.data.frame);
    } else if (question.type === 'groups') {
        renderGroups(question.data.a, question.data.b);
    } else if (question.type === 'takeaway') {
        renderTakeaway(question.data.total, question.data.take);
    } else if (question.type === 'array') {
        renderArray(question.data.groups, question.data.each);
    } else if (question.type === 'line') {
        renderNumberLine(question.data.start, question.data.end, question.data.jumps);
    } else {
        const story = document.createElement('div');
        story.className = 'story-text';
        story.textContent = question.data.text;
        els.visualModel.appendChild(story);
    }
}

function renderTokens(count, useFrame) {
    const field = document.createElement('div');
    field.className = useFrame ? 'ten-frame' : 'token-field';
    const totalSlots = useFrame ? Math.ceil(count / 10) * 10 : count;

    for (let i = 0; i < totalSlots; i++) {
        const token = document.createElement('div');
        token.className = `token${i >= count ? ' empty' : ' blue'}`;
        token.textContent = i < count ? '•' : '';
        field.appendChild(token);
    }

    els.visualModel.appendChild(field);
}

function renderGroups(a, b) {
    const wrapper = document.createElement('div');
    wrapper.className = 'group-wrap';
    wrapper.appendChild(makeGroupBox(a, 'First group', 'blue'));
    wrapper.appendChild(operatorText('+'));
    wrapper.appendChild(makeGroupBox(b, 'Second group', 'green'));
    els.visualModel.appendChild(wrapper);
}

function makeGroupBox(count, label, color) {
    const box = document.createElement('div');
    box.className = 'group-box';
    const title = document.createElement('div');
    title.className = 'group-label';
    title.textContent = label;
    const field = document.createElement('div');
    field.className = 'token-field';

    for (let i = 0; i < count; i++) {
        const token = document.createElement('div');
        token.className = `token ${color}`;
        token.textContent = '•';
        field.appendChild(token);
    }

    box.appendChild(title);
    box.appendChild(field);
    return box;
}

function operatorText(value) {
    const el = document.createElement('div');
    el.className = 'story-text';
    el.textContent = value;
    return el;
}

function renderTakeaway(total, take) {
    const field = document.createElement('div');
    field.className = 'token-field';
    for (let i = 0; i < total; i++) {
        const token = document.createElement('div');
        token.className = `token ${i >= total - take ? 'red' : 'green'}`;
        token.textContent = '•';
        field.appendChild(token);
    }
    els.visualModel.appendChild(field);
}

function renderArray(groups, each) {
    const field = document.createElement('div');
    field.className = 'array-field';
    field.style.setProperty('--columns', each);
    for (let row = 0; row < groups; row++) {
        for (let col = 0; col < each; col++) {
            const token = document.createElement('div');
            token.className = row % 2 === 0 ? 'token blue' : 'token green';
            token.textContent = '•';
            field.appendChild(token);
        }
    }
    els.visualModel.appendChild(field);
}

function renderNumberLine(start, end, jumps) {
    const line = document.createElement('div');
    line.className = 'number-line';

    const track = document.createElement('div');
    track.className = 'line-track';
    const width = Math.max(1, end - start);

    jumps.forEach((jump) => {
        const from = jump.backward ? jump.from : jump.from;
        const left = ((from - start) / width) * 100;
        const size = (jump.size / width) * 100;
        const arc = document.createElement('div');
        arc.className = 'line-jump';
        arc.style.left = `${Math.max(0, Math.min(100, left))}%`;
        arc.style.width = `${Math.max(8, Math.min(92, size))}%`;
        if (jump.backward) {
            arc.style.transform = 'translateX(0) scaleX(-1)';
        }
        track.appendChild(arc);
    });

    const labels = document.createElement('div');
    labels.className = 'line-labels';
    labels.style.setProperty('--steps', end - start + 1);
    const labelStep = Math.max(1, Math.ceil((end - start) / 10));
    for (let n = start; n <= end; n++) {
        const label = document.createElement('span');
        label.textContent = n === start || n === end || n % labelStep === 0 ? n : '';
        labels.appendChild(label);
    }

    line.appendChild(track);
    line.appendChild(labels);
    els.visualModel.appendChild(line);
}

function checkAnswer(value, button) {
    if (state.selected !== null) {
        return;
    }

    const question = state.currentQuestion;
    const correct = value === question.answer;

    if (correct) {
        button.classList.add('correct');
        state.selected = value;
        state.streak += 1;
        state.score += 10 + state.levelIndex * 3 + Math.min(10, state.streak);
        state.mastery[levels[state.levelIndex].id] += 1;

        if (state.streak % 3 === 0) {
            state.stars += 1;
        }

        els.feedback.className = 'feedback success';
        els.feedback.textContent = `${praise[randomInt(0, praise.length - 1)]} ${question.explain}`;
        els.nextBtn.disabled = false;
        els.hintBtn.disabled = true;
        disableOptions();
        renderScore();
        renderMastery();
        saveProgress();
        return;
    }

    button.classList.add('wrong');
    button.disabled = true;
    state.streak = 0;
    els.feedback.className = 'feedback try';
    els.feedback.textContent = `Good try. ${question.hint}`;
    renderScore();
}

function disableOptions() {
    [...els.optionsGrid.querySelectorAll('button')].forEach((button) => {
        button.disabled = true;
    });
}

function showHint() {
    els.feedback.className = 'feedback try';
    els.feedback.textContent = state.currentQuestion.hint;
}

function advance() {
    state.round += 1;

    const currentLevel = levels[state.levelIndex];
    if (state.mastery[currentLevel.id] >= currentLevel.target && state.round > currentLevel.target) {
        const nextLevel = (state.levelIndex + 1) % levels.length;
        state.levelIndex = nextLevel;
        state.round = 1;
        renderTabs();
    }

    nextQuestion();
}

function renderScore() {
    els.scoreValue.textContent = state.score;
    els.streakValue.textContent = state.streak;
    els.starsValue.textContent = state.stars;
}

function saveProgress() {
    const progress = {
        score: state.score,
        stars: state.stars,
        mastery: state.mastery
    };
    localStorage.setItem('mathsQuestProgress', JSON.stringify(progress));
}

function loadProgress() {
    try {
        const saved = JSON.parse(localStorage.getItem('mathsQuestProgress'));
        if (!saved) {
            return;
        }

        state.score = Number(saved.score) || 0;
        state.stars = Number(saved.stars) || 0;
        levels.forEach((level) => {
            state.mastery[level.id] = Number(saved.mastery?.[level.id]) || 0;
        });
    } catch (error) {
        localStorage.removeItem('mathsQuestProgress');
    }
}

function init() {
    loadProgress();
    renderTabs();
    renderMastery();
    renderScore();
    nextQuestion();

    els.hintBtn.addEventListener('click', showHint);
    els.nextBtn.addEventListener('click', advance);
}

init();
