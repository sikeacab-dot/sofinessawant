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

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    setupEventListeners();
    renderAll();
    updateLoveValue();
    updateAlpacaClass('today');
});

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
