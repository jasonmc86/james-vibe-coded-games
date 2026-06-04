// Making a Coffee — step-by-step café mini-game
(function () {
    const STEPS = [
        {
            id: 'grind',
            instruction: 'Step 1: Grind fresh beans. Tap the grinder until the bar is full!',
            emoji: '🫘',
            setup: setupGrind,
        },
        {
            id: 'tamp',
            instruction: 'Step 2: Tamp the grounds evenly so the water flows through just right.',
            emoji: '🟫',
            setup: setupTamp,
        },
        {
            id: 'shot',
            instruction: 'Step 3: Pull the espresso shot. Watch the crema fill your cup!',
            emoji: '☕',
            setup: setupShot,
        },
        {
            id: 'steam',
            instruction: 'Step 4: Steam the milk — stop when the needle is in the green zone!',
            emoji: '🥛',
            setup: setupSteam,
        },
        {
            id: 'pour',
            instruction: 'Step 5: Pour latte art… okay, tap “Pour & serve” when you’re ready!',
            emoji: '🍶',
            setup: setupPour,
        },
    ];

    const instructionEl = document.getElementById('instruction');
    const sceneEmoji = document.getElementById('sceneEmoji');
    const scene = document.getElementById('scene');
    const barWrap = document.getElementById('barWrap');
    const barFill = document.getElementById('barFill');
    const counterArea = document.getElementById('counterArea');
    const extraUI = document.getElementById('extraUI');
    const controls = document.getElementById('controls');
    const progressDots = document.getElementById('progressDots');
    const winOverlay = document.getElementById('winOverlay');
    const playAgainBtn = document.getElementById('playAgain');

    let stepIndex = 0;
    let steamAnimId = null;
    let steamDirection = 1;

    function renderProgressDots() {
        progressDots.innerHTML = '';
        STEPS.forEach((_, i) => {
            const d = document.createElement('span');
            d.className = 'step-dot';
            if (i < stepIndex) d.classList.add('done');
            if (i === stepIndex) d.classList.add('current');
            progressDots.appendChild(d);
        });
    }

    function clearStepUI() {
        counterArea.textContent = '';
        extraUI.innerHTML = '';
        controls.innerHTML = '';
        barWrap.style.display = 'none';
        barFill.className = 'bar-fill';
        if (steamAnimId) {
            cancelAnimationFrame(steamAnimId);
            steamAnimId = null;
        }
    }

    function goNextStep() {
        stepIndex++;
        if (stepIndex >= STEPS.length) {
            winOverlay.classList.add('visible');
            return;
        }
        runStep();
    }

    function runStep() {
        clearStepUI();
        renderProgressDots();
        const step = STEPS[stepIndex];
        instructionEl.textContent = step.instruction;
        sceneEmoji.textContent = step.emoji;
        step.setup();
    }

    function setupGrind() {
        let progress = 0;
        const target = 100;
        const perTap = 14;

        barWrap.style.display = 'block';
        barFill.classList.add('grind');
        barFill.style.width = '0%';
        counterArea.textContent = 'Keep tapping the grinder!';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'action';
        btn.textContent = 'Grind beans';
        btn.addEventListener('click', () => {
            sceneEmoji.classList.remove('shake');
            void sceneEmoji.offsetWidth;
            sceneEmoji.classList.add('shake');
            progress = Math.min(target, progress + perTap + Math.random() * 8);
            barFill.style.width = progress + '%';
            if (progress >= target) {
                btn.disabled = true;
                counterArea.textContent = 'Nicely ground!';
                setTimeout(goNextStep, 450);
            }
        });
        controls.appendChild(btn);
    }

    function setupTamp() {
        let taps = 0;
        const needed = 3;

        counterArea.textContent = `Tamp presses: ${taps} / ${needed}`;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'action';
        btn.textContent = 'Press tamper';
        btn.addEventListener('click', () => {
            taps++;
            sceneEmoji.classList.remove('shake');
            void sceneEmoji.offsetWidth;
            sceneEmoji.classList.add('shake');
            counterArea.textContent = `Tamp presses: ${taps} / ${needed}`;
            if (taps >= needed) {
                btn.disabled = true;
                counterArea.textContent = 'Perfect tamp!';
                setTimeout(goNextStep, 500);
            }
        });
        controls.appendChild(btn);
    }

    function setupShot() {
        barWrap.style.display = 'block';
        barFill.classList.add('shot');
        barFill.style.width = '0%';
        counterArea.textContent = 'Ready when you are.';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'action';
        btn.textContent = 'Pull espresso shot';
        btn.addEventListener('click', () => {
            btn.disabled = true;
            counterArea.textContent = 'Extracting…';
            let p = 0;
            const tick = () => {
                p += 3.2;
                barFill.style.width = Math.min(100, p) + '%';
                if (p < 100) {
                    requestAnimationFrame(tick);
                } else {
                    counterArea.textContent = 'Beautiful crema!';
                    setTimeout(goNextStep, 550);
                }
            };
            requestAnimationFrame(tick);
        });
        controls.appendChild(btn);
    }

    function setupSteam() {
        barWrap.style.display = 'none';
        counterArea.textContent = 'Hold “Steam milk” and release in the green zone.';

        const wrap = document.createElement('div');
        wrap.innerHTML =
            '<div class="zone-indicator" id="steamZone">' +
            '<div class="zone-green"></div>' +
            '<div class="zone-needle" id="steamNeedle"></div>' +
            '</div>' +
            '<p class="steam-hint">Green = silky microfoam</p>';
        while (wrap.firstChild) {
            extraUI.appendChild(wrap.firstChild);
        }

        const needle = document.getElementById('steamNeedle');
        let pos = 8;
        const minP = 5;
        const maxP = 95;
        const greenLeft = 35;
        const greenRight = 65;

        function steamLoop() {
            pos += steamDirection * 1.4;
            if (pos >= maxP || pos <= minP) steamDirection *= -1;
            needle.style.left = pos + '%';
            steamAnimId = requestAnimationFrame(steamLoop);
        }
        steamLoop();

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'action secondary';
        btn.textContent = 'Steam milk (hold)';
        let holding = false;

        function checkRelease() {
            cancelAnimationFrame(steamAnimId);
            steamAnimId = null;
            const inZone = pos >= greenLeft && pos <= greenRight;
            btn.disabled = true;
            if (inZone) {
                counterArea.textContent = 'Milk is velvet-smooth!';
                setTimeout(goNextStep, 500);
            } else {
                counterArea.textContent = 'Too hot or too foamy — try again!';
                btn.disabled = false;
                steamDirection = 1;
                pos = 8;
                needle.style.left = pos + '%';
                steamLoop();
            }
        }

        btn.addEventListener('mousedown', () => {
            holding = true;
        });
        btn.addEventListener('mouseup', () => {
            if (holding) {
                holding = false;
                checkRelease();
            }
        });
        btn.addEventListener('mouseleave', () => {
            if (holding) {
                holding = false;
                checkRelease();
            }
        });

        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            holding = true;
        }, { passive: false });
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (holding) {
                holding = false;
                checkRelease();
            }
        });
        btn.addEventListener('touchcancel', () => {
            if (holding) {
                holding = false;
                checkRelease();
            }
        });

        controls.appendChild(btn);
    }

    function setupPour() {
        counterArea.textContent = 'Almost there!';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'action';
        btn.textContent = 'Pour & serve';
        btn.addEventListener('click', () => {
            btn.disabled = true;
            sceneEmoji.textContent = '☕';
            sceneEmoji.style.transform = 'rotate(-12deg)';
            counterArea.textContent = 'Serving…';
            setTimeout(goNextStep, 400);
        });
        controls.appendChild(btn);
    }

    playAgainBtn.addEventListener('click', () => {
        winOverlay.classList.remove('visible');
        stepIndex = 0;
        sceneEmoji.style.transform = '';
        runStep();
    });

    runStep();
})();
