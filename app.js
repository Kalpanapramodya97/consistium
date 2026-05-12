/* ============================================
   CONSISTIUM — Atomic Habit Tracker
   Application Logic
   ============================================ */

(function () {
  'use strict';

  // ── Constants ──
  const STORAGE_KEY = 'consistium_data';
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const QUOTES = [
    { text: "Every action you take is a vote for the type of person you wish to become.", author: "James Clear" },
    { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
    { text: "Habits are the compound interest of self-improvement.", author: "James Clear" },
    { text: "The most effective way to change your habits is to focus not on what you want to achieve, but on who you wish to become.", author: "James Clear" },
    { text: "Be the designer of your world and not merely the consumer of it.", author: "James Clear" },
    { text: "Success is the product of daily habits — not once-in-a-lifetime transformations.", author: "James Clear" },
    { text: "You should be far more concerned with your current trajectory than with your current results.", author: "James Clear" },
    { text: "All big things come from small beginnings. The seed of every habit is a single, tiny decision.", author: "James Clear" },
    { text: "Missing once is an accident. Missing twice is the start of a new habit.", author: "James Clear" },
    { text: "The task of breaking a bad habit is like uprooting a powerful oak within us.", author: "James Clear" },
    { text: "Goals are good for setting a direction, but systems are best for making progress.", author: "James Clear" },
    { text: "True behavior change is identity change.", author: "James Clear" },
  ];

  const DEFAULT_HABITS = [
    { id: genId(), emoji: '📚', name: 'Read 10 pages', isNew: false },
    { id: genId(), emoji: '💪', name: 'Gym workout', isNew: false },
    { id: genId(), emoji: '🗣️', name: 'Table topic speech', isNew: false },
    { id: genId(), emoji: '💻', name: 'DevOps tutorials × 2', isNew: false },
    { id: genId(), emoji: '📝', name: '12 job applications', isNew: false },
    { id: genId(), emoji: '💼', name: 'Message 5 LinkedIn recruiters & comment on 2 posts', isNew: true },
  ];

  // ── State ──
  let state = loadState();
  let currentDate = new Date();
  resetToMidnight(currentDate);

  // ── DOM Elements ──
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    dateWeekday: $('#dateWeekday'),
    dateFull: $('#dateFull'),
    prevDay: $('#prevDay'),
    nextDay: $('#nextDay'),
    scorePercent: $('#scorePercent'),
    scoreRingFill: $('#scoreRingFill'),
    habitsTracked: $('#habitsTracked'),
    habitsCompleted: $('#habitsCompleted'),
    statusText: $('#statusText'),
    motivationBanner: $('#motivationBanner'),
    confettiContainer: $('#confettiContainer'),
    habitList: $('#habitList'),
    habitHint: $('#habitHint'),
    weeklyHeatmap: $('#weeklyHeatmap'),
    quoteText: $('#quoteText'),
    streakCount: $('#streakCount'),
    addHabitBtn: $('#addHabitBtn'),
    habitModal: $('#habitModal'),
    modalTitle: $('#modalTitle'),
    modalCloseBtn: $('#modalCloseBtn'),
    habitForm: $('#habitForm'),
    habitEmoji: $('#habitEmoji'),
    habitName: $('#habitName'),
    habitIsNew: $('#habitIsNew'),
    habitEditId: $('#habitEditId'),
    saveHabitBtn: $('#saveHabitBtn'),
    deleteHabitBtn: $('#deleteHabitBtn'),
    emojiPicker: $('#emojiPicker'),
    settingsBtn: $('#settingsBtn'),
    settingsModal: $('#settingsModal'),
    settingsCloseBtn: $('#settingsCloseBtn'),
    exportBtn: $('#exportBtn'),
    importBtn: $('#importBtn'),
    importFile: $('#importFile'),
    resetBtn: $('#resetBtn'),
    scoreRing: $('#scoreRing'),
  };

  // ── Helpers ──
  function genId() {
    return '_' + Math.random().toString(36).substr(2, 9);
  }

  function resetToMidnight(d) {
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function dateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function isToday(d) {
    const t = new Date();
    resetToMidnight(t);
    return dateKey(d) === dateKey(t);
  }

  function isFuture(d) {
    const t = new Date();
    resetToMidnight(t);
    return d > t;
  }

  // ── Persistence ──
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Validate structure
        if (parsed.habits && parsed.completions) return parsed;
      }
    } catch (e) { /* ignore */ }
    return {
      habits: DEFAULT_HABITS,
      completions: {} // { "2026-05-12": { habitId: true } }
    };
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // ── SVG Gradient (inject into score ring) ──
  function injectGradient() {
    const svg = dom.scoreRing;
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', 'scoreGradient');
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', '#a78bfa');
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%'); stop2.setAttribute('stop-color', '#22c55e');

    grad.appendChild(stop1);
    grad.appendChild(stop2);
    defs.appendChild(grad);
    svg.insertBefore(defs, svg.firstChild);
  }

  // ── Render Functions ──
  function renderDate() {
    dom.dateWeekday.textContent = FULL_DAYS[currentDate.getDay()];
    dom.dateFull.textContent = `${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
  }

  function renderScore() {
    const key = dateKey(currentDate);
    const completions = state.completions[key] || {};
    const total = state.habits.length;
    const done = state.habits.filter(h => completions[h.id]).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    // Animate percent text
    animateValue(dom.scorePercent, pct, '%');

    // Ring
    const circumference = 2 * Math.PI * 52; // ~326.73
    const offset = circumference - (pct / 100) * circumference;
    dom.scoreRingFill.style.strokeDashoffset = offset;

    // Stats
    dom.habitsTracked.textContent = total;
    dom.habitsCompleted.textContent = `${done}/${total}`;

    // Status
    if (done === 0) {
      dom.statusText.textContent = 'Pending';
      dom.statusText.style.color = 'var(--text-muted)';
    } else if (done < total) {
      dom.statusText.textContent = 'In progress';
      dom.statusText.style.color = 'var(--warning)';
    } else {
      dom.statusText.textContent = 'On a streak 🔥';
      dom.statusText.style.color = 'var(--success)';
    }

    // Motivation banner
    if (done === total && total > 0) {
      dom.motivationBanner.style.display = 'flex';
      spawnConfetti();
    } else {
      dom.motivationBanner.style.display = 'none';
    }

    // Hint
    if (done === total && total > 0) {
      dom.habitHint.textContent = 'All habits done! Perfect day 🏆';
    } else if (isFuture(currentDate)) {
      dom.habitHint.textContent = 'Future date — habits will unlock on that day';
    } else {
      dom.habitHint.textContent = 'Tap a pending habit to mark it done';
    }
  }

  function animateValue(el, target, suffix) {
    const current = parseInt(el.textContent) || 0;
    if (current === target) { el.textContent = target + suffix; return; }
    const diff = target - current;
    const steps = Math.min(Math.abs(diff), 20);
    const stepTime = 400 / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const val = Math.round(current + (diff * (step / steps)));
      el.textContent = val + suffix;
      if (step >= steps) clearInterval(timer);
    }, stepTime);
  }

  function renderHabits() {
    const key = dateKey(currentDate);
    const completions = state.completions[key] || {};
    dom.habitList.innerHTML = '';

    state.habits.forEach((habit, i) => {
      const isDone = !!completions[habit.id];
      const card = document.createElement('div');
      card.className = `habit-card${isDone ? ' done' : ''}`;
      card.style.animationDelay = `${i * 0.05}s`;
      card.dataset.id = habit.id;

      card.innerHTML = `
        <div class="habit-emoji">${habit.emoji}</div>
        <div class="habit-info">
          <div class="habit-name">
            ${habit.name}
            ${habit.isNew ? '<span class="new-badge">New</span>' : ''}
          </div>
          <div class="habit-status-label">${isDone ? 'Done' : 'Pending'}</div>
        </div>
        <button class="habit-edit-btn" data-edit="${habit.id}" title="Edit habit" aria-label="Edit ${habit.name}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <div class="habit-check">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      `;

      // Toggle completion on card click
      card.addEventListener('click', (e) => {
        if (e.target.closest('.habit-edit-btn')) return;
        toggleHabit(habit.id);
      });

      // Edit button
      const editBtn = card.querySelector('.habit-edit-btn');
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(habit);
      });

      dom.habitList.appendChild(card);
    });
  }

  function renderStreak() {
    let streak = 0;
    const today = new Date();
    resetToMidnight(today);

    // Count backwards from today (or yesterday if today isn't complete)
    const checkDate = new Date(today);
    const todayKey = dateKey(today);
    const todayCompletions = state.completions[todayKey] || {};
    const todayDone = state.habits.every(h => todayCompletions[h.id]);

    if (!todayDone) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const key = dateKey(checkDate);
      const completions = state.completions[key] || {};
      const allDone = state.habits.length > 0 && state.habits.every(h => completions[h.id]);
      if (!allDone) break;
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Include today if all done
    if (todayDone && state.habits.length > 0) streak++;

    dom.streakCount.textContent = streak;
  }

  function renderWeeklyHeatmap() {
    dom.weeklyHeatmap.innerHTML = '';
    const today = new Date();
    resetToMidnight(today);

    // Get start of week (Monday)
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const key = dateKey(d);
      const completions = state.completions[key] || {};
      const total = state.habits.length;
      const done = state.habits.filter(h => completions[h.id]).length;
      const pct = total > 0 ? done / total : 0;

      let level = 0;
      if (pct > 0 && pct <= 0.25) level = 1;
      else if (pct > 0.25 && pct <= 0.5) level = 2;
      else if (pct > 0.5 && pct < 1) level = 3;
      else if (pct === 1) level = 4;

      const isCurrentDay = dateKey(d) === dateKey(today);
      const dayEl = document.createElement('div');
      dayEl.className = `heatmap-day${isCurrentDay ? ' today' : ''}`;
      dayEl.innerHTML = `
        <span class="heatmap-label">${DAYS[d.getDay()]}</span>
        <div class="heatmap-dot level-${level}"></div>
        <span class="heatmap-score">${total > 0 ? Math.round(pct * 100) + '%' : '—'}</span>
      `;

      // Click to navigate to that day
      dayEl.style.cursor = 'pointer';
      dayEl.addEventListener('click', () => {
        currentDate = new Date(d);
        renderAll();
      });

      dom.weeklyHeatmap.appendChild(dayEl);
    }
  }

  function renderQuote() {
    const idx = Math.floor(Math.random() * QUOTES.length);
    dom.quoteText.textContent = QUOTES[idx].text;
  }

  function renderAll() {
    renderDate();
    renderHabits();
    renderScore();
    renderStreak();
    renderWeeklyHeatmap();
  }

  // ── Actions ──
  function toggleHabit(habitId) {
    const key = dateKey(currentDate);
    if (!state.completions[key]) state.completions[key] = {};

    if (state.completions[key][habitId]) {
      delete state.completions[key][habitId];
    } else {
      state.completions[key][habitId] = true;
    }

    saveState();
    renderAll();
  }

  function spawnConfetti() {
    dom.confettiContainer.innerHTML = '';
    const colors = ['#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
    for (let i = 0; i < 24; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = Math.random() * 0.8 + 's';
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      dom.confettiContainer.appendChild(piece);
    }
  }

  // ── Modal Logic ──
  function openAddModal() {
    dom.modalTitle.textContent = 'Add New Habit';
    dom.saveHabitBtn.textContent = 'Add Habit';
    dom.deleteHabitBtn.style.display = 'none';
    dom.habitName.value = '';
    dom.habitIsNew.checked = false;
    dom.habitEditId.value = '';
    dom.habitEmoji.value = '🎯';
    $$('.emoji-opt').forEach(b => b.classList.remove('selected'));
    const defaultEmoji = document.querySelector('.emoji-opt[data-emoji="🎯"]');
    if (defaultEmoji) defaultEmoji.classList.add('selected');
    dom.habitModal.style.display = 'flex';
    dom.habitName.focus();
  }

  function openEditModal(habit) {
    dom.modalTitle.textContent = 'Edit Habit';
    dom.saveHabitBtn.textContent = 'Save Changes';
    dom.deleteHabitBtn.style.display = 'block';
    dom.habitName.value = habit.name;
    dom.habitIsNew.checked = habit.isNew;
    dom.habitEditId.value = habit.id;
    dom.habitEmoji.value = habit.emoji;
    $$('.emoji-opt').forEach(b => {
      b.classList.toggle('selected', b.dataset.emoji === habit.emoji);
    });
    dom.habitModal.style.display = 'flex';
    dom.habitName.focus();
  }

  function closeModal() {
    dom.habitModal.style.display = 'none';
  }

  function saveHabit(e) {
    e.preventDefault();
    const name = dom.habitName.value.trim();
    if (!name) return;

    const editId = dom.habitEditId.value;
    const emoji = dom.habitEmoji.value;
    const isNew = dom.habitIsNew.checked;

    if (editId) {
      const habit = state.habits.find(h => h.id === editId);
      if (habit) {
        habit.name = name;
        habit.emoji = emoji;
        habit.isNew = isNew;
      }
    } else {
      state.habits.push({ id: genId(), emoji, name, isNew });
    }

    saveState();
    closeModal();
    renderAll();
  }

  function deleteHabit() {
    const editId = dom.habitEditId.value;
    if (!editId) return;
    if (!confirm('Delete this habit? This cannot be undone.')) return;

    state.habits = state.habits.filter(h => h.id !== editId);
    // Clean up completions
    Object.keys(state.completions).forEach(key => {
      delete state.completions[key][editId];
    });

    saveState();
    closeModal();
    renderAll();
  }

  // ── Settings ──
  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `consistium-backup-${dateKey(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData() {
    dom.importFile.click();
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (evt) {
      try {
        const data = JSON.parse(evt.target.result);
        if (data.habits && data.completions) {
          state = data;
          saveState();
          renderAll();
          alert('Data imported successfully!');
        } else {
          alert('Invalid backup file.');
        }
      } catch {
        alert('Failed to parse backup file.');
      }
    };
    reader.readAsText(file);
    dom.importFile.value = '';
  }

  function resetData() {
    if (!confirm('Reset all data? This will delete all habits and history.')) return;
    if (!confirm('Are you absolutely sure?')) return;
    localStorage.removeItem(STORAGE_KEY);
    state = { habits: DEFAULT_HABITS.map(h => ({ ...h, id: genId() })), completions: {} };
    saveState();
    renderAll();
    dom.settingsModal.style.display = 'none';
  }

  // ── Event Listeners ──
  function init() {
    injectGradient();
    renderAll();
    renderQuote();

    // Date navigation
    dom.prevDay.addEventListener('click', () => {
      currentDate.setDate(currentDate.getDate() - 1);
      renderAll();
    });

    dom.nextDay.addEventListener('click', () => {
      currentDate.setDate(currentDate.getDate() + 1);
      renderAll();
    });

    // Add habit
    dom.addHabitBtn.addEventListener('click', openAddModal);

    // Modal
    dom.modalCloseBtn.addEventListener('click', closeModal);
    dom.habitModal.addEventListener('click', (e) => {
      if (e.target === dom.habitModal) closeModal();
    });
    dom.habitForm.addEventListener('submit', saveHabit);
    dom.deleteHabitBtn.addEventListener('click', deleteHabit);

    // Emoji picker
    $$('.emoji-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.emoji-opt').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        dom.habitEmoji.value = btn.dataset.emoji;
      });
    });

    // Settings
    dom.settingsBtn.addEventListener('click', () => {
      dom.settingsModal.style.display = 'flex';
    });
    dom.settingsCloseBtn.addEventListener('click', () => {
      dom.settingsModal.style.display = 'none';
    });
    dom.settingsModal.addEventListener('click', (e) => {
      if (e.target === dom.settingsModal) dom.settingsModal.style.display = 'none';
    });
    dom.exportBtn.addEventListener('click', exportData);
    dom.importBtn.addEventListener('click', importData);
    dom.importFile.addEventListener('change', handleImport);
    dom.resetBtn.addEventListener('click', resetData);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
        dom.settingsModal.style.display = 'none';
      }
      if (e.key === 'ArrowLeft' && !dom.habitModal.style.display.includes('flex')) {
        currentDate.setDate(currentDate.getDate() - 1);
        renderAll();
      }
      if (e.key === 'ArrowRight' && !dom.habitModal.style.display.includes('flex')) {
        currentDate.setDate(currentDate.getDate() + 1);
        renderAll();
      }
    });
  }

  // ── Boot ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
