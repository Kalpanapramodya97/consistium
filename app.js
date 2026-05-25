/* ============================================
   CONSISTIUM — Atomic Habit Tracker
   Application Logic
   ============================================ */

(function () {
  'use strict';

  // ── Initial Theme Load (prevent flash, default: light) ──
  const savedTheme = localStorage.getItem('consistium_theme');
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    document.documentElement.classList.add('dark-theme');
  } else {
    document.documentElement.classList.remove('dark-theme');
  }

  // ── Constants ──
  const STORAGE_KEY = 'consistium_data';
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const QUOTES = [
  // Atomic Habits
  { "text": "You do not rise to the level of your goals. You fall to the level of your systems.", "author": "James Clear, Atomic Habits" },
  { "text": "Habits are the compound interest of self-improvement.", "author": "James Clear, Atomic Habits" },
  { "text": "Every action you take is a vote for the type of person you wish to become.", "author": "James Clear, Atomic Habits" },
  { "text": "Success is the product of daily habits—not once-in-a-lifetime transformations.", "author": "James Clear, Atomic Habits" },
  { "text": "The most effective way to change your habits is to focus not on what you want to achieve, but on who you wish to become.", "author": "James Clear, Atomic Habits" },
  { "text": "A slight change in your daily habits can guide your life to a very different destination.", "author": "James Clear, Atomic Habits" },
  { "text": "Environment is the invisible hand that shapes human behavior.", "author": "James Clear, Atomic Habits" },

  // Deep Work
  { "text": "To produce at your peak level you need to work for extended periods with full concentration on a single task free from distraction.", "author": "Cal Newport, Deep Work" },
  { "text": "If you don't produce, you won't thrive—no matter how skilled or talented you are.", "author": "Cal Newport, Deep Work" },
  { "text": "Clarity about what matters provides clarity about what does not.", "author": "Cal Newport, Deep Work" },
  { "text": "The ability to quickly master hard things and the ability to produce at an elite level, in terms of both quality and speed, are two core abilities for thriving in the new economy.", "author": "Cal Newport, Deep Work" },

  // Mindset
  { "text": "In a growth mindset, challenges are exciting rather than threatening. So rather than thinking, oh, I'm going to reveal my weaknesses, you say, wow, here's a chance to grow.", "author": "Carol S. Dweck, Mindset" },
  { "text": "The passion for stretching yourself and sticking to it, even (or especially) when it's not going well, is the hallmark of the growth mindset.", "author": "Carol S. Dweck, Mindset" },
  { "text": "We like to think of our champions and idols as superheroes who were born different from us. We don't like to think of them as relatively ordinary people who made themselves extraordinary.", "author": "Carol S. Dweck, Mindset" },
  { "text": "No matter what your ability is, effort is what ignites that ability and turns it into accomplishment.", "author": "Carol S. Dweck, Mindset" },
  { "text": "Becoming is better than being.", "author": "Carol S. Dweck, Mindset" },

  // Wild Courage
  { "text": "Chase what you want with wild courage.", "author": "Jenny Wood, Wild Courage" },
  { "text": "Fear is just a signal that you're about to do something brave.", "author": "Jenny Wood, Wild Courage" },
  { "text": "Speak up, stand out, and claim your space.", "author": "Jenny Wood, Wild Courage" },
  { "text": "You don't need permission to be bold. You just need wild courage.", "author": "Jenny Wood, Wild Courage" },
  { "text": "Rejection is simply redirection. Keep moving forward with courage.", "author": "Jenny Wood, Wild Courage" }
];

  const DEFAULT_HABITS = [
    { id: genId(), emoji: '📚', name: 'Read 10 pages', isNew: false, type: 'good' },
    { id: genId(), emoji: '💪', name: 'Gym workout', isNew: false, type: 'good' },
    { id: genId(), emoji: '🗣️', name: 'Table topic speech', isNew: false, type: 'good' },
    { id: genId(), emoji: '💻', name: 'DevOps tutorials × 2', isNew: false, type: 'good' },
    { id: genId(), emoji: '📝', name: '12 job applications', isNew: false, type: 'good' },
    { id: genId(), emoji: '💼', name: 'Message 5 LinkedIn recruiters & comment on 2 posts', isNew: true, type: 'good' },
  ];

  // ── State ──
  let state = loadState();
  let currentDate = new Date();
  resetToMidnight(currentDate);
  let currentQuoteIdx = -1;

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
    goodHabitList: $('#goodHabitList'),
    badHabitList: $('#badHabitList'),
    goodHabitCount: $('#goodHabitCount'),
    badHabitCount: $('#badHabitCount'),
    specialTaskCount: $('#specialTaskCount'),
    goodHabitsHeader: $('#goodHabitsHeader'),
    badHabitsHeader: $('#badHabitsHeader'),
    specialTasksHeader: $('#specialTasksHeader'),
    specialTaskList: $('#specialTaskList'),
    habitHint: $('#habitHint'),
    weeklyHeatmap: $('#weeklyHeatmap'),
    quoteText: $('#quoteText'),
    quoteAuthor: $('#quoteAuthor'),
    prevQuote: $('#prevQuote'),
    nextQuote: $('#nextQuote'),
    streakCount: $('#streakCount'),
    addHabitBtn: $('#addHabitBtn'),
    habitModal: $('#habitModal'),
    modalTitle: $('#modalTitle'),
    modalCloseBtn: $('#modalCloseBtn'),
    habitForm: $('#habitForm'),
    habitEmoji: $('#habitEmoji'),
    habitName: $('#habitName'),
    habitIsNew: $('#habitIsNew'),
    habitType: $('#habitType'),
    habitTypeToggle: $('#habitTypeToggle'),
    habitEditId: $('#habitEditId'),
    saveHabitBtn: $('#saveHabitBtn'),
    deleteHabitBtn: $('#deleteHabitBtn'),
    emojiPicker: $('#emojiPicker'),
    themeToggleBtn: $('#themeToggleBtn'),
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
        if (parsed.habits && parsed.completions) {
          parsed.tasks = parsed.tasks || {};
          return parsed;
        }
      }
    } catch (e) { /* ignore */ }
    return {
      habits: DEFAULT_HABITS,
      completions: {}, // { "2026-05-12": { habitId: true } }
      tasks: {} // { "2026-05-12": [{ id, name, emoji, isCompleted }] }
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

  function getHabitScore(habit, completions) {
    // Good habits: done when checked. Bad habits: done when NOT checked (resisted).
    if (habit.type === 'bad') return !completions[habit.id];
    return !!completions[habit.id];
  }

  function renderScore() {
    const key = dateKey(currentDate);
    const completions = state.completions[key] || {};
    const todayTasks = state.tasks[key] || [];
    
    const total = state.habits.length + todayTasks.length;
    let done = state.habits.filter(h => getHabitScore(h, completions)).length;
    done += todayTasks.filter(t => t.isCompleted).length;
    
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    animateValue(dom.scorePercent, pct, '%');

    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (pct / 100) * circumference;
    dom.scoreRingFill.style.strokeDashoffset = offset;

    dom.habitsTracked.textContent = total;
    dom.habitsCompleted.textContent = `${done}/${total}`;

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

    if (done === total && total > 0) {
      dom.motivationBanner.style.display = 'flex';
      spawnConfetti();
    } else {
      dom.motivationBanner.style.display = 'none';
    }

    if (done === total && total > 0) {
      dom.habitHint.textContent = 'All habits on track! Perfect day 🏆';
    } else if (isFuture(currentDate)) {
      dom.habitHint.textContent = 'Future date — habits will unlock on that day';
    } else {
      dom.habitHint.textContent = 'Tap a habit to update its status';
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

  function buildHabitCard(habit, completions, index) {
    const isChecked = !!completions[habit.id];
    const isBad = habit.type === 'bad';
    let statusLabel, cardClass;

    if (isBad) {
      statusLabel = isChecked ? 'Slipped ✗' : 'Resisted ✓';
      cardClass = `habit-card bad-habit${isChecked ? ' slipped' : ' resisted'}`;
    } else {
      statusLabel = isChecked ? 'Done' : 'Pending';
      cardClass = `habit-card${isChecked ? ' done' : ''}`;
    }

    const card = document.createElement('div');
    card.className = cardClass;
    card.style.animationDelay = `${index * 0.05}s`;
    card.dataset.id = habit.id;

    const checkIcon = isBad && isChecked
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

    card.innerHTML = `
      <div class="habit-emoji">${habit.emoji}</div>
      <div class="habit-info">
        <div class="habit-name">
          ${habit.name}
          ${habit.isNew ? '<span class="new-badge">New</span>' : ''}
          ${isBad ? '<span class="bad-badge">Break</span>' : ''}
        </div>
        <div class="habit-status-label">${statusLabel}</div>
      </div>
      <button class="habit-edit-btn" data-edit="${habit.id}" title="Edit" aria-label="Edit ${habit.name}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <div class="habit-check">${checkIcon}</div>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('.habit-edit-btn')) return;
      toggleHabit(habit.id);
    });

    card.querySelector('.habit-edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(habit);
    });

    return card;
  }

  function buildTaskCard(task, key, index) {
    const isChecked = task.isCompleted;
    const statusLabel = isChecked ? 'Done' : 'Pending';
    const cardClass = `habit-card${isChecked ? ' done' : ''}`;

    const card = document.createElement('div');
    card.className = cardClass;
    card.style.animationDelay = `${index * 0.05}s`;
    card.dataset.id = task.id;

    const checkIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

    card.innerHTML = `
      <div class="habit-emoji">${task.emoji}</div>
      <div class="habit-info">
        <div class="habit-name">
          ${task.name}
          <span class="special-badge">Special</span>
        </div>
        <div class="habit-status-label">${statusLabel}</div>
      </div>
      <button class="habit-edit-btn" data-edit="${task.id}" title="Edit" aria-label="Edit ${task.name}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <div class="habit-check">${checkIcon}</div>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('.habit-edit-btn')) return;
      toggleTask(task.id, key);
    });

    card.querySelector('.habit-edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal({ ...task, type: 'task' });
    });

    return card;
  }

  function renderHabits() {
    const key = dateKey(currentDate);
    const completions = state.completions[key] || {};
    const tasks = state.tasks[key] || [];
    
    dom.goodHabitList.innerHTML = '';
    dom.badHabitList.innerHTML = '';
    dom.specialTaskList.innerHTML = '';

    const goodHabits = state.habits.filter(h => h.type !== 'bad');
    const badHabits = state.habits.filter(h => h.type === 'bad');

    goodHabits.forEach((h, i) => dom.goodHabitList.appendChild(buildHabitCard(h, completions, i)));
    badHabits.forEach((h, i) => dom.badHabitList.appendChild(buildHabitCard(h, completions, i)));
    tasks.forEach((t, i) => dom.specialTaskList.appendChild(buildTaskCard(t, key, i)));

    dom.goodHabitCount.textContent = goodHabits.length;
    dom.badHabitCount.textContent = badHabits.length;
    dom.specialTaskCount.textContent = tasks.length;
    
    dom.goodHabitsHeader.style.display = goodHabits.length ? 'flex' : 'none';
    dom.badHabitsHeader.style.display = badHabits.length ? 'flex' : 'none';
    dom.specialTasksHeader.style.display = tasks.length ? 'flex' : 'none';
  }

  function renderStreak() {
    let streak = 0;
    const today = new Date();
    resetToMidnight(today);

    // Count backwards from today (or yesterday if today isn't complete)
    const checkDate = new Date(today);
    const todayKey = dateKey(today);
    const todayCompletions = state.completions[todayKey] || {};
    const todayTasks = state.tasks[todayKey] || [];
    const todayDone = state.habits.every(h => getHabitScore(h, todayCompletions)) &&
                      (todayTasks.length === 0 || todayTasks.every(t => t.isCompleted));

    if (!todayDone) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const key = dateKey(checkDate);
      const completions = state.completions[key] || {};
      const tasks = state.tasks[key] || [];
      const hasHabits = state.habits.length > 0;
      const allDone = hasHabits && state.habits.every(h => getHabitScore(h, completions)) &&
                      (tasks.length === 0 || tasks.every(t => t.isCompleted));
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
      const tasks = state.tasks[key] || [];
      
      const total = state.habits.length + tasks.length;
      let done = state.habits.filter(h => getHabitScore(h, completions)).length;
      done += tasks.filter(t => t.isCompleted).length;
      
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

  function renderQuote(idx) {
    if (QUOTES.length === 0) return;
    if (idx === undefined) {
      idx = Math.floor(Math.random() * QUOTES.length);
    }
    currentQuoteIdx = idx;
    
    // Add fade out class
    dom.quoteText.parentElement.style.opacity = '0';
    
    setTimeout(() => {
      dom.quoteText.textContent = QUOTES[currentQuoteIdx].text;
      dom.quoteAuthor.textContent = "— " + QUOTES[currentQuoteIdx].author;
      dom.quoteText.parentElement.style.opacity = '1';
    }, 300);
  }

  function renderAll() {
    renderDate();
    renderHabits();
    renderScore();
    renderStreak();
    renderWeeklyHeatmap();
    renderQuote();
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

  function toggleTask(taskId, key) {
    if (!state.tasks[key]) return;
    const task = state.tasks[key].find(t => t.id === taskId);
    if (task) {
      task.isCompleted = !task.isCompleted;
      saveState();
      renderAll();
    }
  }

  // ── Modal Logic ──
  function setModalType(type) {
    dom.habitType.value = type;
    $$('.type-opt').forEach(b => b.classList.toggle('selected', b.dataset.type === type));
    // Toggle emoji visibility
    $$('.emoji-good').forEach(b => b.style.display = (type === 'good' || type === 'task') ? '' : 'none');
    $$('.emoji-bad').forEach(b => b.style.display = type === 'bad' ? '' : 'none');
    // Clear emoji selection and pick first visible default
    $$('.emoji-opt').forEach(b => b.classList.remove('selected'));
    const defaultEmoji = type === 'bad' ? '🚬' : '🎯';
    const def = document.querySelector(`.emoji-opt[data-emoji="${defaultEmoji}"]`);
    if (def) { def.classList.add('selected'); dom.habitEmoji.value = defaultEmoji; }
    // Update placeholder
    dom.habitName.placeholder = type === 'bad' ? 'e.g. Doom scrolling' : (type === 'task' ? 'e.g. Call dentist' : 'e.g. Read 10 pages');
  }

  function openAddModal() {
    dom.modalTitle.textContent = 'Add New Habit';
    dom.saveHabitBtn.textContent = 'Add Habit';
    dom.deleteHabitBtn.style.display = 'none';
    dom.habitName.value = '';
    dom.habitIsNew.checked = false;
    dom.habitEditId.value = '';
    setModalType('good');
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
    setModalType(habit.type || 'good');
    dom.habitEmoji.value = habit.emoji;
    $$('.emoji-opt').forEach(b => b.classList.toggle('selected', b.dataset.emoji === habit.emoji));
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
    const type = dom.habitType.value || 'good';

    if (type === 'task') {
      const key = dateKey(currentDate);
      if (!state.tasks[key]) state.tasks[key] = [];
      if (editId) {
        const task = state.tasks[key].find(t => t.id === editId);
        if (task) {
          task.name = name;
          task.emoji = emoji;
        }
      } else {
        state.tasks[key].push({ id: genId(), emoji, name, isCompleted: false });
      }
    } else {
      if (editId) {
        const habit = state.habits.find(h => h.id === editId);
        if (habit) {
          habit.name = name;
          habit.emoji = emoji;
          habit.isNew = isNew;
          habit.type = type;
        }
      } else {
        state.habits.push({ id: genId(), emoji, name, isNew, type });
      }
    }

    saveState();
    closeModal();
    renderAll();
  }

  function deleteHabit() {
    const editId = dom.habitEditId.value;
    const type = dom.habitType.value;
    if (!editId) return;
    if (!confirm('Delete this? This cannot be undone.')) return;

    if (type === 'task') {
      const key = dateKey(currentDate);
      if (state.tasks[key]) {
        state.tasks[key] = state.tasks[key].filter(t => t.id !== editId);
      }
    } else {
      state.habits = state.habits.filter(h => h.id !== editId);
      // Clean up completions
      Object.keys(state.completions).forEach(key => {
        delete state.completions[key][editId];
      });
    }

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
    state = { habits: DEFAULT_HABITS.map(h => ({ ...h, id: genId() })), completions: {}, tasks: {} };
    saveState();
    renderAll();
    dom.settingsModal.style.display = 'none';
  }

  // ── Event Listeners ──
  function init() {
    injectGradient();
    renderAll();
    renderQuote();
    setInterval(() => renderQuote(), 5 * 60 * 1000); // Change quote every 5 minutes

    // Quote navigation
    dom.prevQuote.addEventListener('click', () => {
      let nextIdx = currentQuoteIdx - 1;
      if (nextIdx < 0) nextIdx = QUOTES.length - 1;
      renderQuote(nextIdx);
    });

    dom.nextQuote.addEventListener('click', () => {
      let nextIdx = currentQuoteIdx + 1;
      if (nextIdx >= QUOTES.length) nextIdx = 0;
      renderQuote(nextIdx);
    });

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

    // Habit type toggle
    $$('.type-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        setModalType(btn.dataset.type);
      });
    });

    // Emoji picker
    $$('.emoji-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.emoji-opt').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        dom.habitEmoji.value = btn.dataset.emoji;
      });
    });

    // Theme Toggle
    dom.themeToggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark-theme');
      localStorage.setItem('consistium_theme', isDark ? 'dark' : 'light');
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
