// Telegram WebApp Initialization
const tg = window.Telegram.WebApp;
tg.expand();
tg.headerColor = '#f28b82'; // Coral

// API Configuration
const BOT_TOKEN = '8598780340:AAGHvK0qbbw8RkM76OtYpI49MDbIHwe9_5Q';
const CHAT_ID = '5030636855';

// App State
let state = {
    'eat': [],
    'sweet': [],
    'time': [],
    'special': [],
    'wish-gifts': [],
    'wish-leisure': []
};

// Default Values
const defaults = {
    'eat': ['Домашняя паста', 'Заказать поке'],
    'sweet': ['Шоколадный фондан', 'Свежие ягоды'],
    'time': ['Прогулка в парке', 'Кино дома'],
    'special': ['Пикник на закате', 'Сюрприз']
};

let currentModalTarget = null;
let currentModalIndex = null;

// Hidden Game State
const GAME_LIMIT = 2;
let alpacaClickCount = 0;
let alpacaClickTimer = null;
const PRIZES = [
    { name: 'Синабон', icon: '🥐' },
    { name: 'Тортик', icon: '🍰' },
    { name: 'Брауни', icon: '🍪' },
    { name: 'Буэно', icon: '🍫' },
    { name: 'Куртюш', icon: '🥨' },
    { name: 'Горячий шоколад', icon: '☕' },
    { name: 'Бельгийская вафля', icon: '🧇' },
    { name: 'Лимонный тарт', icon: '🍋' },
    { name: 'Вишня в шоколаді', icon: '🍒' },
    { name: 'Морожено', icon: '🍦' },
    { name: 'Шоколадка', icon: '🍫' },
    { name: 'Соломка в шоколаді', icon: '🥢' },
    { name: 'Кукурудзяні палички з азійського магазу', icon: '🌽' }
];
const SLOT_SYMBOLS = PRIZES.map(p => p.icon); // Using icons for slots to keep it visual
let currentPrize = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    setupEventListeners();
    renderAll();
    updateLoveValue();
    updateAlpacaClass('today');
    setupAlpacaSecret();
});

function setupAlpacaSecret() {
    const alpaca = document.querySelector('.decor-alpaca');
    if (!alpaca) return;

    // Make it clickable but remove pointer-events: none from CSS if needed, 
    // or just use capturing since it's above other elements. 
    // Wait, CSS says pointer-events: none. I must change that.
    alpaca.style.pointerEvents = 'auto';
    alpaca.style.cursor = 'pointer';

    alpaca.addEventListener('click', (e) => {
        e.stopPropagation();

        // Check if chocolate is already dropped
        if (document.getElementById('chocolate-drop').style.display === 'block') return;

        alpacaClickCount++;

        clearTimeout(alpacaClickTimer);
        alpacaClickTimer = setTimeout(() => {
            alpacaClickCount = 0;
        }, 2000); // Reset if no click for 2s

        triggerAlpacaJump();
        tg.HapticFeedback.impactOccurred('light');

        if (alpacaClickCount === 5) {
            dropChocolate(e.clientX, e.clientY);
            alpacaClickCount = 0;
        }
    });
}

function dropChocolate(x, y) {
    const drop = document.getElementById('chocolate-drop');
    drop.style.left = x + 'px';
    drop.style.top = y + 'px';
    drop.style.display = 'block';
    drop.classList.add('chocolate-fall');

    tg.HapticFeedback.notificationOccurred('success');

    // Auto-hide if not clicked after some time? Nah, let it stay.
}

function loadState() {
    const saved = localStorage.getItem('sofinessa_state_v3');
    if (saved) {
        state = JSON.parse(saved);
    } else {
        Object.keys(defaults).forEach(key => {
            state[key] = defaults[key].map(text => ({ text, link: '' }));
        });
        saveState();
    }
}

function saveState() {
    localStorage.setItem('sofinessa_state_v3', JSON.stringify(state));
}

function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');

            updateAlpacaClass(tabId);
            triggerAlpacaJump();
            tg.HapticFeedback.impactOccurred('medium');

            // Spawn some hearts on tab change
            for (let i = 0; i < 3; i++) setTimeout(spawnHeart, i * 200);
        });
    });

    // Feedback Range
    const range = document.getElementById('fb-love');
    if (range) {
        range.addEventListener('input', updateLoveValue);
    }

    // Send To Cat
    document.getElementById('send-to-cat').addEventListener('click', () => {
        const message = formatDailyMessage();
        sendMessageToBot(message, 'send-to-cat');
        spawnHeart();
    });

    // Send Feedback
    document.getElementById('send-feedback').addEventListener('click', () => {
        const message = formatFeedbackMessage();
        sendMessageToBot(message, 'send-feedback');
        for (let i = 0; i < 5; i++) spawnHeart();
    });

    // Input Enter support
    document.querySelectorAll('.add-item input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const target = input.id.replace('input-', '');
                addItem(target);
            }
        });
    });

    // Global click for jump
    document.addEventListener('click', (e) => {
        // Don't jump if clicking something that already has its own haptic/action (like buttons) 
        // OR just jump anyway as it's cute. Let's do it on every significant click.
        triggerAlpacaJump();
    });
}

function triggerAlpacaJump() {
    const alpaca = document.querySelector('.decor-alpaca');
    if (!alpaca) return;
    alpaca.classList.remove('alpaca-jump');
    void alpaca.offsetWidth; // Trigger reflow
    alpaca.classList.add('alpaca-jump');
    setTimeout(() => alpaca.classList.remove('alpaca-jump'), 600);
}

function updateAlpacaClass(tabId) {
    const app = document.getElementById('app');
    app.classList.remove('tab-today', 'tab-wishlist', 'tab-feedback');
    app.classList.add(`tab-${tabId}`);
}

function spawnHeart() {
    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.innerHTML = '❤️';
    heart.style.left = Math.random() * 100 + 'vw';
    heart.style.bottom = '0';
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 4000);
}

function updateLoveValue() {
    const val = document.getElementById('fb-love').value;
    document.getElementById('love-value').innerText = `${val}%`;
}

function formatDailyMessage() {
    let msg = "👑 *Избранные желания Софинессы на сегодня!*\n\n";
    const categories = {
        'eat': "🍽 Кушать:",
        'sweet': "🍫 Сладкое:",
        'time': "✨ Досуг:",
        'special': "💖 Особенное:"
    };

    let hasSelection = false;
    Object.keys(categories).forEach(cat => {
        // Filter only selected items
        const selectedItems = state[cat].filter(item => item.selected);
        if (selectedItems.length > 0) {
            msg += `*${categories[cat]}*\n`;
            selectedItems.forEach(item => {
                msg += `- ${item.text} ${item.link ? `([ссылка](${item.link}))` : ''}\n`;
            });
            msg += "\n";
            hasSelection = true;
        }
    });
    return hasSelection ? msg : "Она пока ничего не выбрала... но всё равно любит тебя! 🐾";
}

function formatFeedbackMessage() {
    const he = document.getElementById('fb-he').value || '---';
    const happy = document.getElementById('fb-happy').value || '---';
    const unhappy = document.getElementById('fb-unhappy').value || '---';
    const love = document.getElementById('fb-love').value;
    const more = document.getElementById('fb-more').value || '---';

    return `💌 *Отзыв для Кота*\n\n` +
        `👤 *Сегодня он:* ${he}\n` +
        `😊 *Я довольна:* ${happy}\n` +
        `😟 *Я недовольна:* ${unhappy}\n` +
        `❤️ *Любят на:* ${love}%\n` +
        `📝 *А еще:* ${more}`;
}

async function sendMessageToBot(text, btnId) {
    const btn = document.getElementById(btnId);
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = 'Отправляю... 🚀';

    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CHAT_ID, text: text, parse_mode: 'Markdown' })
        });

        if (response.ok) {
            tg.HapticFeedback.notificationOccurred('success');
            btn.innerText = 'Улетело к Коту! ❤️';
            setTimeout(() => {
                btn.innerText = originalText;
                btn.disabled = false;
                if (btnId === 'send-feedback') clearFeedbackForm();
            }, 3000);
        } else { throw new Error('API Error'); }
    } catch (e) {
        tg.HapticFeedback.notificationOccurred('error');
        btn.innerText = 'Ошибка! 😿';
        setTimeout(() => { btn.innerText = originalText; btn.disabled = false; }, 3000);
    }
}

function clearFeedbackForm() {
    ['fb-he', 'fb-happy', 'fb-unhappy', 'fb-more'].forEach(id => document.getElementById(id).value = '');
}

function toggleExpand(id) {
    const group = document.getElementById(id).parentElement;
    group.classList.toggle('expanded');
    tg.HapticFeedback.selectionChanged();
}

function renderAll() {
    Object.keys(state).forEach(key => renderList(key));
}

function renderList(target) {
    const list = document.getElementById(`${target}-list`);
    if (!list) return;

    list.innerHTML = '';
    state[target].forEach((item, index) => {
        const li = document.createElement('li');
        li.className = `desire-item ${item.selected ? 'selected' : ''}`;

        // Flag/Selection logic only for "Today" tabs, Wishlist is just a list
        const isTodayTab = ['eat', 'sweet', 'time', 'special'].includes(target);
        const checkboxHtml = isTodayTab ? `<div class="custom-checkbox"></div>` : '';

        const linkHtml = item.link ? `<a href="${item.link}" target="_blank" class="action-btn" onclick="event.stopPropagation()">🔗</a>` : '';

        li.innerHTML = `
            <div class="item-left">
                ${checkboxHtml}
                <div class="item-text-wrapper"><span>${item.text}</span></div>
            </div>
            <div class="item-actions">
                ${linkHtml}
                <button class="action-btn" onclick="event.stopPropagation(); openLinkModal('${target}', ${index})">📎</button>
                <button class="action-btn" onclick="event.stopPropagation(); removeItem('${target}', ${index})">✕</button>
            </div>
        `;

        if (isTodayTab) {
            li.onclick = () => toggleSelection(target, index);
        }
        list.appendChild(li);
    });
}

function toggleSelection(target, index) {
    state[target][index].selected = !state[target][index].selected;
    saveState();
    renderList(target);
    tg.HapticFeedback.selectionChanged();
}

function addItem(target) {
    const input = document.getElementById(`input-${target}`);
    const text = input.value.trim();
    if (!text) return;

    // New items start as unselected
    state[target].push({ text, link: '', selected: false });
    input.value = '';
    saveState();
    renderList(target);
    tg.HapticFeedback.impactOccurred('medium');
}

function removeItem(target, index) {
    state[target].splice(index, 1);
    saveState();
    renderList(target);
}

function openLinkModal(target, index) {
    currentModalTarget = target;
    currentModalIndex = index;
    const modal = document.getElementById('link-modal');
    document.getElementById('modal-link-input').value = state[target][index].link || '';
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('link-modal').classList.remove('active');
}

function saveLink() {
    const link = document.getElementById('modal-link-input').value.trim();
    state[currentModalTarget][currentModalIndex].link = link;
    saveState();
    renderList(currentModalTarget);
    closeModal();
    tg.HapticFeedback.notificationOccurred('success');
}

// Slot Machine Logic
// Slot Machine Logic
function getGamePlays() {
    const today = new Date().toLocaleDateString();
    const data = localStorage.getItem('game_play_data');

    // Migration from old logic if exists
    if (!data) {
        const oldLastPlay = localStorage.getItem('last_play_date');
        if (oldLastPlay === today) {
            return 1; // Assume they played once if old flag is set for today
        }
        return 0;
    }

    try {
        const parsed = JSON.parse(data);
        return parsed.date === today ? parsed.count : 0;
    } catch (e) {
        return 0;
    }
}

function incrementGamePlays() {
    const today = new Date().toLocaleDateString();
    const count = getGamePlays() + 1;
    localStorage.setItem('game_play_data', JSON.stringify({ date: today, count: count }));
    // Also update old key for compatibility
    localStorage.setItem('last_play_date', today);
}

function openGameModal() {
    const playedToday = getGamePlays();

    if (playedToday >= GAME_LIMIT) {
        tg.HapticFeedback.notificationOccurred('error');
        tg.showAlert(`Сегодня ты уже использовала обе попытки! Приходи завтра 💖`);
        return;
    }

    document.getElementById('chocolate-drop').style.display = 'none';
    document.getElementById('chocolate-drop').classList.remove('chocolate-fall');

    // Clear win celebration
    document.querySelector('.slots').classList.remove('win-celebration');

    // Reset symbols to initial state
    const initialSymbols = ['🍒', '🍫', '🍰'];
    [1, 2, 3].forEach(i => {
        const inner = document.querySelector(`#slot${i} .slot-inner`);
        inner.innerHTML = `<div style="height: 100px; width: 100%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${initialSymbols[i - 1]}</div>`;
        inner.style.transform = 'none';
        inner.style.transition = 'none';
        inner.classList.remove('spinning');
    });

    // Reset game state UI
    document.getElementById('spin-btn').style.display = 'block';
    document.getElementById('spin-btn').disabled = false;
    document.getElementById('spin-btn').innerText = 'Крутить!';
    document.getElementById('claim-btn').style.display = 'none';
    document.getElementById('game-modal').classList.add('active');

    tg.HapticFeedback.impactOccurred('medium');
}

function spinSlots() {
    incrementGamePlays();
    const playedToday = getGamePlays();

    const spinBtn = document.getElementById('spin-btn');
    spinBtn.disabled = true;
    spinBtn.innerText = 'Крутим... ✨';

    tg.HapticFeedback.impactOccurred('heavy');

    const slots = [
        document.getElementById('slot1'),
        document.getElementById('slot2'),
        document.getElementById('slot3')
    ];

    // Determine outcome (30% win rate)
    const isWin = Math.random() < 0.3;
    let results = [];

    if (isWin) {
        const prizeIndex = Math.floor(Math.random() * PRIZES.length);
        const symbol = PRIZES[prizeIndex].icon;
        currentPrize = PRIZES[prizeIndex];
        results = [symbol, symbol, symbol];
    } else {
        const indices = [
            Math.floor(Math.random() * SLOT_SYMBOLS.length),
            Math.floor(Math.random() * SLOT_SYMBOLS.length),
            Math.floor(Math.random() * SLOT_SYMBOLS.length)
        ];
        if (indices[0] === indices[1] && indices[1] === indices[2]) {
            indices[2] = (indices[2] + 1) % SLOT_SYMBOLS.length;
        }
        results = indices.map(idx => SLOT_SYMBOLS[idx]);
    }

    slots.forEach((s, i) => {
        const inner = s.querySelector('.slot-inner');
        const symbolHeight = 100;
        const itemCount = 40;

        // Winning symbol at the TOP
        let reelContent = `<div style="height: ${symbolHeight}px; width: 100%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${results[i]}</div>`;

        // Random items BELOW
        for (let j = 0; j < itemCount; j++) {
            const randomSymbol = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
            reelContent += `<div style="height: ${symbolHeight}px; width: 100%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${randomSymbol}</div>`;
        }

        inner.innerHTML = reelContent;
        inner.style.transition = 'none';
        inner.style.transform = `translateY(-${itemCount * symbolHeight}px)`;
        s.classList.add('spinning');
    });

    // Stop sequence
    setTimeout(() => {
        slots.forEach((s, i) => {
            setTimeout(() => {
                const inner = s.querySelector('.slot-inner');
                s.classList.remove('spinning');

                // Glide DOWN to symbols at the top (0 position)
                inner.style.transition = 'transform 2s cubic-bezier(0.1, 0.9, 0.3, 1)';
                inner.style.transform = 'translateY(0)';

                tg.HapticFeedback.impactOccurred('light');

                if (i === 2) {
                    if (isWin) {
                        document.querySelector('.slots').classList.add('win-celebration');
                        tg.HapticFeedback.notificationOccurred('success');
                        setTimeout(() => {
                            spinBtn.style.display = 'none';
                            document.getElementById('claim-btn').style.display = 'block';
                        }, 1300);
                    } else {
                        const remaining = GAME_LIMIT - playedToday;
                        tg.HapticFeedback.notificationOccurred('error');
                        spinBtn.disabled = true;

                        if (remaining > 0) {
                            spinBtn.innerText = `Ещё ${remaining} попытка!`;
                            setTimeout(() => {
                                spinBtn.disabled = false;
                                spinBtn.innerText = 'Крутить! ✨';
                            }, 2000);
                        } else {
                            spinBtn.innerText = 'Повезет завтра! 🍀';
                            setTimeout(() => {
                                document.getElementById('game-modal').classList.remove('active');
                            }, 3000);
                        }

                        const lossMsg = remaining > 0
                            ? `Софинесса проиграла... 😢 Но у неё есть ещё одна попытка!`
                            : `Софинесса проиграла... 😢 Попытки на сегодня закончены.`;
                        sendTelegramNotification('ЛОСЬ!', lossMsg);
                    }
                }
            }, i * 600);
        });
    }, 2000);
}

function showPrize() {
    document.getElementById('prize-icon').innerText = currentPrize.icon;
    document.getElementById('prize-name').innerText = currentPrize.name;

    document.getElementById('game-modal').classList.remove('active');
    const prizeModal = document.getElementById('prize-modal');
    prizeModal.classList.add('active');
    prizeModal.classList.add('no-close-modal');

    tg.HapticFeedback.impactOccurred('heavy');
}

async function collectPrize() {
    const btn = document.getElementById('final-collect-btn');
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = 'Забираю... 🍫';

    const message = `🎰 *ВЫИГРЫШ В КАЗИНО!*\n\n` +
        `Софинесса выбила джекпот и выиграла: *${currentPrize.name}* ${currentPrize.icon}\n\n` +
        `Кот, пора исполнять! 💖`;

    const success = await sendTelegramNotification('ВЫИГРЫШ!', message);

    if (success) {
        tg.HapticFeedback.notificationOccurred('success');
        btn.innerText = 'Выигрыш твой! ❤️';
        setTimeout(() => {
            const prizeModal = document.getElementById('prize-modal');
            prizeModal.classList.remove('active');
            prizeModal.classList.remove('no-close-modal');
            btn.disabled = false;
            btn.innerText = originalText;
        }, 2000);
    } else {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

async function sendTelegramNotification(type, text) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: text,
                parse_mode: 'Markdown'
            })
        });
        return response.ok;
    } catch (e) {
        console.error('Notification error:', e);
        tg.HapticFeedback.notificationOccurred('error');
        return false;
    }
}
