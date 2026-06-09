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
    // Auth & Admin
    authBtn: $('#authBtn'),
    adminBtn: $('#adminBtn'),
    authModal: $('#authModal'),
    authCloseBtn: $('#authCloseBtn'),
    authForm: $('#authForm'),
    authNameGroup: $('#authNameGroup'),
    authName: $('#authName'),
    authEmail: $('#authEmail'),
    authPassword: $('#authPassword'),
    authError: $('#authError'),
    authToggleModeBtn: $('#authToggleModeBtn'),
    authSubmitBtn: $('#authSubmitBtn'),
    authModalTitle: $('#authModalTitle'),
    authProfileView: $('#authProfileView'),
    logoutBtn: $('#logoutBtn'),
    adminModal: $('#adminModal'),
    adminCloseBtn: $('#adminCloseBtn'),
    adminTotalUsers: $('#adminTotalUsers'),
    adminTotalHabits: $('#adminTotalHabits'),
    adminTotalCompletions: $('#adminTotalCompletions'),
    adminUserList: $('#adminUserList')
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

  // ── Auth & API ──
  const API_URL = '/api';
  let authToken = localStorage.getItem('consistium_token');
  let currentUser = null;

  async function apiFetch(endpoint, options = {}) {
    if (!options.headers) options.headers = {};
    if (authToken) options.headers['Authorization'] = `Bearer ${authToken}`;
    options.headers['Content-Type'] = 'application/json';
    
    const res = await fetch(`${API_URL}${endpoint}`, options);
    if (!res.ok) {
      if (res.status === 401) {
        logout();
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'API Error');
    }
    return res.json();
  }

  async function syncStateFromApi() {
    if (!authToken) return;
    try {
      currentUser = await apiFetch('/auth/me');
      if (currentUser.role === 'admin') {
        dom.adminBtn.style.display = 'flex';
      }
      
      const habits = await apiFetch('/habits');
      // For simple sync, we map API habits back to local structure
      state.habits = habits.map(h => ({
        id: h._id,
        name: h.name,
        emoji: h.emoji,
        type: h.type,
        isNew: h.isNewHabit
      }));
      
      // We'd ideally fetch completions for all days in state, but let's fetch today's at least
      const todayKey = dateKey(currentDate);
      const completions = await apiFetch(`/habits/completions/${todayKey}`);
      state.completions[todayKey] = {};
      completions.forEach(cid => {
        state.completions[todayKey][cid] = true;
      });

      renderAll();
    } catch (e) {
      console.error('Sync failed', e);
    }
  }

  function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('consistium_token');
    state = { habits: DEFAULT_HABITS, completions: {}, tasks: {} };
    dom.adminBtn.style.display = 'none';
    renderAll();
    updateAuthUI();
  }

  function updateAuthUI() {
    if (authToken) {
      dom.authProfileView.style.display = 'block';
      dom.authForm.style.display = 'none';
      if (currentUser) {
        $('#profileName').textContent = currentUser.name;
        $('#profileEmail').textContent = currentUser.email;
      }
    } else {
      dom.authProfileView.style.display = 'none';
      dom.authForm.style.display = 'block';
    }
  }

  // ── Persistence ──
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.habits && parsed.completions) {
          parsed.tasks = parsed.tasks || {};
          return parsed;
        }
      }
    } catch (e) { /* ignore */ }
    return {
      habits: DEFAULT_HABITS,
      completions: {},
      tasks: {}
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
  async function toggleHabit(habitId) {
    const key = dateKey(currentDate);
    if (!state.completions[key]) state.completions[key] = {};

    if (state.completions[key][habitId]) {
      delete state.completions[key][habitId];
    } else {
      state.completions[key][habitId] = true;
    }

    saveState();
    renderAll();

    if (authToken) {
      try {
        await apiFetch('/habits/completions', {
          method: 'POST',
          body: JSON.stringify({ habitId, dateKey: key })
        });
      } catch (e) {
        console.error('Toggle failed API sync', e);
      }
    }
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

  async function saveHabit(e) {
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
      saveState();
      closeModal();
      renderAll();
    } else {
      try {
        if (authToken) {
          if (editId && !editId.startsWith('_')) {
            await apiFetch(`/habits/${editId}`, {
              method: 'PUT',
              body: JSON.stringify({ name, emoji, type, isNewHabit: isNew })
            });
          } else {
            await apiFetch('/habits', {
              method: 'POST',
              body: JSON.stringify({ name, emoji, type, isNewHabit: isNew })
            });
          }
          await syncStateFromApi();
        } else {
          // Local fallback
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
          saveState();
          renderAll();
        }
        closeModal();
      } catch (e) {
        alert(e.message);
      }
    }
  }

  async function deleteHabit() {
    const editId = dom.habitEditId.value;
    const type = dom.habitType.value;
    if (!editId) return;
    if (!confirm('Delete this? This cannot be undone.')) return;

    if (type === 'task') {
      const key = dateKey(currentDate);
      if (state.tasks[key]) {
        state.tasks[key] = state.tasks[key].filter(t => t.id !== editId);
      }
      saveState();
      closeModal();
      renderAll();
    } else {
      if (authToken && !editId.startsWith('_')) {
        try {
          await apiFetch(`/habits/${editId}`, { method: 'DELETE' });
          await syncStateFromApi();
          closeModal();
        } catch (e) {
          alert(e.message);
        }
      } else {
        state.habits = state.habits.filter(h => h.id !== editId);
        Object.keys(state.completions).forEach(key => {
          delete state.completions[key][editId];
        });
        saveState();
        closeModal();
        renderAll();
      }
    }
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

    // Auth Modal
    dom.authBtn.addEventListener('click', () => {
      dom.authModal.style.display = 'flex';
    });
    dom.authCloseBtn.addEventListener('click', () => {
      dom.authModal.style.display = 'none';
      dom.authError.style.display = 'none';
    });
    let isRegisterMode = false;
    dom.authToggleModeBtn.addEventListener('click', () => {
      isRegisterMode = !isRegisterMode;
      dom.authNameGroup.style.display = isRegisterMode ? 'block' : 'none';
      dom.authModalTitle.textContent = isRegisterMode ? 'Register' : 'Login';
      dom.authToggleModeBtn.textContent = isRegisterMode ? 'Already have an account? Login' : 'Need an account? Register';
      dom.authSubmitBtn.textContent = isRegisterMode ? 'Register' : 'Login';
      dom.authError.style.display = 'none';
    });
    dom.authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = dom.authEmail.value;
      const password = dom.authPassword.value;
      const name = dom.authName.value;
      const endpoint = isRegisterMode ? '/auth/register' : '/auth/login';
      const body = isRegisterMode ? { name, email, password } : { email, password };
      
      try {
        const data = await apiFetch(endpoint, {
          method: 'POST',
          body: JSON.stringify(body)
        });
        authToken = data.token;
        localStorage.setItem('consistium_token', authToken);
        dom.authModal.style.display = 'none';
        dom.authError.style.display = 'none';
        dom.authForm.reset();
        await syncStateFromApi();
        updateAuthUI();
      } catch (err) {
        dom.authError.textContent = err.message;
        dom.authError.style.display = 'block';
      }
    });
    dom.logoutBtn.addEventListener('click', () => {
      logout();
      dom.authModal.style.display = 'none';
    });

    // Admin Dashboard — navigate to dedicated page
    dom.adminBtn.addEventListener('click', () => {
      window.location.href = 'admin.html';
    });

    // Handle global delete user function
    window.deleteUser = async (userId) => {
      if (!confirm('Delete this user? This cannot be undone.')) return;
      try {
        await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
        dom.adminBtn.click(); // reload
      } catch (err) {
        alert('Error: ' + err.message);
      }
    };

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
    document.addEventListener('DOMContentLoaded', async () => {
      init();
      updateAuthUI();
      await syncStateFromApi();
    });
  } else {
    init();
    updateAuthUI();
    syncStateFromApi();
  }

  // ============================================
  // AI HABIT ADVISOR MODULE
  // ============================================
  
  const AI_KNOWLEDGE = {
    analyze: [
      (ctx) => {
        const { total, done, pct, goodCount, badCount, streak, goodHabits, badHabits } = ctx;
        let analysis = `<strong>📊 Your Habit Dashboard</strong><br><br>`;
        analysis += `You're tracking <strong>${total} habit${total !== 1 ? 's' : ''}</strong> (${goodCount} positive, ${badCount} to break).<br><br>`;
        
        if (pct === 100) {
          analysis += `🏆 <strong>Perfect score today!</strong> You've completed everything. You're living proof that consistency beats motivation.<br><br>`;
          analysis += `<div class="advice-highlight">💎 Pro tip: Don't forget to celebrate small wins — it rewires your brain to associate habits with positive feelings.</div>`;
        } else if (pct >= 70) {
          analysis += `⚡ <strong>${pct}% completion</strong> — solid progress! You're in the sweet spot. `;
          const remaining = total - done;
          analysis += `Just <strong>${remaining} more</strong> to go for a perfect day.<br><br>`;
          analysis += `<div class="advice-highlight">🎯 Focus on the next single habit. Don't think about all ${remaining} — just the very next one.</div>`;
        } else if (pct >= 40) {
          analysis += `🔄 <strong>${pct}% done</strong> — you're getting there. Remember: "You don't have to be extreme, just consistent."<br><br>`;
          analysis += `<div class="advice-highlight">💡 Try the 2-minute rule: Scale each remaining habit down to just 2 minutes. Start tiny, finish strong.</div>`;
        } else if (pct > 0) {
          analysis += `🌱 <strong>${pct}% so far</strong> — every journey starts with a single step, and you've taken yours.<br><br>`;
          analysis += `<div class="advice-highlight">🔑 Stack your habits: Tie each new habit to one you already do. "After I [existing habit], I will [new habit]."</div>`;
        } else {
          analysis += `📋 <strong>Fresh start today!</strong> No habits completed yet — but that's okay. The day isn't over.<br><br>`;
          analysis += `<div class="advice-highlight">⚡ Quick win strategy: Pick the easiest habit and do it RIGHT NOW. Momentum is real.</div>`;
        }

        if (streak > 0) {
          analysis += `<br>🔥 You're on a <strong>${streak}-day streak</strong>! `;
          if (streak >= 21) analysis += `That's incredible — you're past the habit formation threshold!`;
          else if (streak >= 7) analysis += `One full week of consistency. Your neural pathways are strengthening.`;
          else analysis += `Keep it going — the first week is the hardest.`;
        }
        
        return analysis;
      }
    ],
    suggest: [
      (ctx) => {
        const categories = [
          { title: '🧠 Mental Wellness', habits: ['Meditate for 5 minutes', 'Journal 3 gratitudes', 'Digital detox for 1 hour', 'Practice deep breathing'] },
          { title: '💪 Physical Health', habits: ['10-minute morning stretch', 'Drink 8 glasses of water', 'Walk 10,000 steps', 'Sleep by 10:30 PM'] },
          { title: '📚 Growth & Learning', habits: ['Read 20 pages', 'Learn one new word', 'Watch a TED talk', 'Practice a skill for 15 min'] },
          { title: '🤝 Relationships', habits: ['Text a friend', 'Give a genuine compliment', 'Call a family member', 'Practice active listening'] },
          { title: '💼 Productivity', habits: ['Plan tomorrow tonight', 'Complete the hardest task first', 'Take a break every 90 min', 'Review weekly goals'] }
        ];

        const existing = ctx.habitNames.map(n => n.toLowerCase());
        let response = `<strong>💡 Personalized Habit Suggestions</strong><br><br>`;
        response += `Based on your current ${ctx.total} habits, here are categories to consider:<br><br>`;

        const selectedCats = categories.sort(() => Math.random() - 0.5).slice(0, 3);
        selectedCats.forEach(cat => {
          const newOnes = cat.habits.filter(h => !existing.some(e => e.includes(h.toLowerCase().slice(0, 8))));
          const picks = newOnes.sort(() => Math.random() - 0.5).slice(0, 2);
          if (picks.length) {
            response += `<strong>${cat.title}</strong><ul>`;
            picks.forEach(p => response += `<li>${p}</li>`);
            response += `</ul>`;
          }
        });

        response += `<div class="advice-highlight">🧪 The <strong>Atomic Habits</strong> rule: Make it obvious, attractive, easy, and satisfying. Start with just 2 minutes of any new habit.</div>`;
        return response;
      }
    ],
    motivation: [
      () => {
        const messages = [
          `<strong>🔥 You Are Unstoppable</strong><br><br>Remember: <em>"The secret of getting ahead is getting started."</em> — Mark Twain<br><br>Every single habit you complete is a vote for the person you want to become. Not a big, dramatic vote — a tiny, quiet one. But those tiny votes compound.<br><br><div class="advice-highlight">🧮 Math of 1% better daily:<br>1.01^365 = <strong>37.78x improvement</strong> in one year!</div>`,
          
          `<strong>💪 Your Future Self is Watching</strong><br><br>Think about who you'll be in 6 months if you keep showing up every day. That person is <em>grateful</em> you started today.<br><br><em>"We are what we repeatedly do. Excellence, then, is not an act, but a habit."</em> — Aristotle<br><br><div class="advice-highlight">🎯 Don't break the chain. Every day you show up, the chain gets stronger. One missed day is a mistake. Two missed days is the start of a new (bad) habit.</div>`,
          
          `<strong>🌟 Progress, Not Perfection</strong><br><br>You don't need a perfect day. You need a <strong>consistent</strong> one. Even completing 50% of your habits puts you ahead of 90% of people who set no intentions at all.<br><br><em>"The man who moves a mountain begins by carrying away small stones."</em> — Confucius<br><br><div class="advice-highlight">⚡ Motivation is what gets you started. <strong>Habit</strong> is what keeps you going. Trust the system, not the feeling.</div>`,
          
          `<strong>🚀 The Compound Effect</strong><br><br>Tiny changes, remarkable results. That's not just a tagline — it's neuroscience.<br><br>Every time you repeat a habit, you're physically <strong>rewiring your brain</strong>. Myelin wraps around neural pathways, making them faster and more automatic.<br><br><div class="advice-highlight">🧠 After ~66 days of consistent practice, a habit becomes nearly automatic. You're building neural infrastructure right now.</div>`
        ];
        return messages[Math.floor(Math.random() * messages.length)];
      }
    ],
    streak: [
      (ctx) => {
        let response = `<strong>📈 Streak Strategy Guide</strong><br><br>`;
        
        if (ctx.streak === 0) {
          response += `You're starting fresh — perfect. Here's how to build an unbreakable streak:<br><br>`;
          response += `<ul>`;
          response += `<li><strong>Never miss twice.</strong> One bad day doesn't break a habit. Two does.</li>`;
          response += `<li><strong>Reduce scope, not schedule.</strong> Do less on hard days, but still show up.</li>`;
          response += `<li><strong>Track visibly.</strong> Use this app daily — what gets measured gets managed.</li>`;
          response += `</ul><br>`;
        } else if (ctx.streak < 7) {
          response += `🔥 <strong>${ctx.streak}-day streak</strong> — you're in the critical first week!<br><br>`;
          response += `Research shows <strong>Days 3-7 are the hardest</strong>. The novelty wears off but the habit hasn't automated yet. Push through this valley!<br><br>`;
          response += `<ul>`;
          response += `<li><strong>Reward yourself</strong> after each completed day</li>`;
          response += `<li><strong>Environment design:</strong> Remove friction for good habits, add friction for bad ones</li>`;
          response += `<li><strong>Identity shift:</strong> Say "I'm someone who..." instead of "I'm trying to..."</li>`;
          response += `</ul>`;
        } else if (ctx.streak < 21) {
          response += `🔥🔥 <strong>${ctx.streak}-day streak</strong> — you're building serious momentum!<br><br>`;
          response += `You're approaching the <strong>21-day milestone</strong> where many habits begin to feel more natural.<br><br>`;
          response += `<div class="advice-highlight">🎯 Pro tip: Now is the time to slightly increase difficulty. If you read 10 pages, try 12. The "progressive overload" principle works for habits too.</div>`;
        } else {
          response += `🔥🔥🔥 <strong>${ctx.streak}-day streak</strong> — you're a habit machine!<br><br>`;
          response += `At this point, these habits are becoming part of your <strong>identity</strong>. You're no longer just doing them — you ARE someone who does them.<br><br>`;
          response += `<div class="advice-highlight">🏆 Challenge: Consider adding one new micro-habit to your stack. You've proven you can be consistent. Time to level up.</div>`;
        }
        
        return response;
      }
    ],
    science: [
      () => {
        const facts = [
          `<strong>🔬 The Science of Habit Formation</strong><br><br>Every habit follows the <strong>Habit Loop</strong> (from Charles Duhigg's research):<br><br><ul><li><strong>Cue:</strong> The trigger that initiates the behavior</li><li><strong>Craving:</strong> The motivational force behind it</li><li><strong>Response:</strong> The actual behavior/habit</li><li><strong>Reward:</strong> The satisfying outcome</li></ul><br><div class="advice-highlight">🧪 To build a habit: make the cue obvious, the craving attractive, the response easy, and the reward satisfying.</div>`,
          
          `<strong>🧠 Neuroplasticity & Habits</strong><br><br>When you repeat a behavior, your brain creates <strong>stronger neural connections</strong> through a process called <em>long-term potentiation</em>.<br><br>Think of it like a path through a forest — the more you walk it, the more defined it becomes. Eventually, it becomes the default route.<br><br><div class="advice-highlight">📊 Research by Phillippa Lally (2009) found it takes an average of <strong>66 days</strong> to form a new habit — not 21 days as commonly believed. Range: 18–254 days depending on complexity.</div>`,
          
          `<strong>⚡ Dopamine & The Reward System</strong><br><br>Here's a fascinating finding: dopamine rises <em>before</em> the reward, during <strong>anticipation</strong>. This is why habits that feel rewarding in the moment are easiest to build.<br><br><ul><li><strong>Temptation bundling:</strong> Pair a habit you need to do with one you want to do</li><li><strong>Immediate rewards:</strong> Add a small pleasure after completing a hard habit</li><li><strong>Tracking itself is rewarding:</strong> The visual progress in this app triggers satisfaction</li></ul><br><div class="advice-highlight">🎯 The brain prioritizes immediate rewards. Make good habits immediately satisfying and bad habits immediately unsatisfying.</div>`
        ];
        return facts[Math.floor(Math.random() * facts.length)];
      }
    ],
    morning: [
      () => {
        const routines = [
          `<strong>🌅 The Miracle Morning Framework</strong><br><br>Based on Hal Elrod's SAVERS method, a powerful morning routine includes:<br><br><ul><li><strong>S</strong>ilence — 5 min meditation or deep breathing</li><li><strong>A</strong>ffirmations — Repeat your identity-based goals</li><li><strong>V</strong>isualization — Picture your ideal day</li><li><strong>E</strong>xercise — 10 min movement (even stretching counts)</li><li><strong>R</strong>eading — 10 pages of a growth book</li><li><strong>S</strong>cribing — Journal key thoughts or gratitudes</li></ul><br><div class="advice-highlight">⏰ Start with a <strong>10-minute version</strong>: 2 min silence + 2 min affirmations + 2 min visualization + 2 min exercise + 2 min reading. Scale up over time.</div>`,
          
          `<strong>☀️ Science-Backed Morning Wins</strong><br><br>Research shows these morning actions set you up for the best day possible:<br><br><ul><li><strong>Sunlight within 30 min</strong> of waking — resets your circadian rhythm</li><li><strong>Cold water on face</strong> — activates the vagus nerve, boosts alertness</li><li><strong>No phone for first 30 min</strong> — protects your dopamine baseline</li><li><strong>Protein-rich breakfast</strong> — stabilizes blood sugar and focus</li><li><strong>Make your bed</strong> — first small win creates momentum</li></ul><br><div class="advice-highlight">🧠 Andrew Huberman's tip: Get 10 min of morning sunlight to set your master clock. This single habit improves sleep, mood, and energy.</div>`
        ];
        return routines[Math.floor(Math.random() * routines.length)];
      }
    ],
    breaking: [
      (ctx) => {
        let response = `<strong>🚫 Breaking Bad Habits — The Inversion Strategy</strong><br><br>`;
        
        if (ctx.badCount > 0) {
          response += `You're tracking <strong>${ctx.badCount} bad habit${ctx.badCount > 1 ? 's' : ''}</strong> to break. Here's how to make them disappear:<br><br>`;
        }
        
        response += `James Clear's <strong>Inversion of the 4 Laws</strong>:<br><br>`;
        response += `<ul>`;
        response += `<li><strong>Make it invisible:</strong> Remove cues from your environment. If you snack too much, don't keep snacks visible.</li>`;
        response += `<li><strong>Make it unattractive:</strong> Reframe the habit. Instead of "I can't" say "I don't." ("I don't doom scroll" vs "I can't doom scroll")</li>`;
        response += `<li><strong>Make it difficult:</strong> Add friction. Log out of social media after each use. Use website blockers.</li>`;
        response += `<li><strong>Make it unsatisfying:</strong> Create accountability. Tell someone about your goal. Use a habit contract.</li>`;
        response += `</ul><br>`;
        response += `<div class="advice-highlight">🔑 The key insight: You don't eliminate a bad habit — you <strong>replace</strong> it. Find a healthier behavior that delivers a similar reward.</div>`;
        
        return response;
      }
    ],
    stacking: [
      (ctx) => {
        let response = `<strong>🔗 Habit Stacking — The Ultimate Strategy</strong><br><br>`;
        response += `The formula: <em>"After I [CURRENT HABIT], I will [NEW HABIT]."</em><br><br>`;
        
        if (ctx.goodHabits.length >= 2) {
          response += `Here's a custom stack based on your habits:<br><br>`;
          const shuffled = [...ctx.goodHabits].sort(() => Math.random() - 0.5);
          const stackSize = Math.min(shuffled.length, 4);
          response += `<div class="advice-highlight">`;
          for (let i = 0; i < stackSize; i++) {
            if (i === 0) {
              response += `☀️ Wake up → <strong>${shuffled[i].emoji} ${shuffled[i].name}</strong><br>`;
            } else {
              response += `↓ After that → <strong>${shuffled[i].emoji} ${shuffled[i].name}</strong><br>`;
            }
          }
          response += `</div><br>`;
        }
        
        response += `<strong>Why it works:</strong><br>`;
        response += `<ul>`;
        response += `<li>Each completed habit becomes the <strong>cue</strong> for the next</li>`;
        response += `<li>Creates a <strong>chain of momentum</strong> — each success fuels the next</li>`;
        response += `<li>Reduces decision fatigue — you don't think "should I?", you just follow the sequence</li>`;
        response += `<li>Leverages <strong>implementation intentions</strong> (specific when/where plans), which research shows doubles success rates</li>`;
        response += `</ul>`;
        
        return response;
      }
    ]
  };

  const FREETEXT_RESPONSES = [
    { keywords: ['procrastinat', 'lazy', 'can\'t start', 'putting off', 'delaying'], response: () => `<strong>⏳ Beating Procrastination</strong><br><br>Procrastination isn't a time problem — it's an <strong>emotion regulation</strong> problem. You're avoiding discomfort, not avoiding the task.<br><br><ul><li><strong>The 2-Minute Rule:</strong> If it takes less than 2 minutes, do it now. If it takes more, start with just 2 minutes.</li><li><strong>Temptation bundling:</strong> Pair the dreaded task with something you enjoy</li><li><strong>Implementation intention:</strong> "I will [TASK] at [TIME] in [LOCATION]"</li><li><strong>Eat the frog:</strong> Do the hardest thing first when willpower is highest</li></ul><br><div class="advice-highlight">🧠 Your brain overestimates the pain of starting. Studies show that once you begin, the perceived difficulty drops by 50%.</div>` },
    { keywords: ['sleep', 'insomnia', 'tired', 'rest', 'bedtime', 'wake up'], response: () => `<strong>😴 Sleep Optimization Habits</strong><br><br>Sleep is the foundation of all other habits. Here's the science-backed protocol:<br><br><ul><li><strong>Consistent wake time</strong> — more important than bedtime</li><li><strong>No screens 1 hour before bed</strong> — blue light suppresses melatonin by 50%</li><li><strong>Cool room (65-68°F / 18-20°C)</strong> — core body temp drop triggers sleep</li><li><strong>Sunlight within 30 min of waking</strong> — sets circadian rhythm</li><li><strong>No caffeine after 2 PM</strong> — half-life is 5-7 hours</li></ul><br><div class="advice-highlight">📊 Research: Every hour of sleep before midnight is worth 2 hours after. Aim for 7-9 hours consistently.</div>` },
    { keywords: ['exercise', 'workout', 'gym', 'fitness', 'run', 'walk'], response: () => `<strong>🏃 Exercise Habit Tips</strong><br><br>The best exercise habit is one you'll actually do. Here's how to make it stick:<br><br><ul><li><strong>Start absurdly small:</strong> 5 pushups or a 10-minute walk</li><li><strong>Lay out clothes the night before</strong> — reduce morning friction</li><li><strong>Track something simple:</strong> Just "did I move today?"</li><li><strong>Find a workout buddy</strong> — social accountability increases adherence by 65%</li><li><strong>Anchor it:</strong> "After my morning coffee, I stretch for 5 minutes"</li></ul><br><div class="advice-highlight">⚡ The minimum effective dose: 150 min/week of moderate activity or 75 min/week of vigorous activity. That's just ~22 min/day!</div>` },
    { keywords: ['read', 'book', 'learning', 'study', 'learn'], response: () => `<strong>📚 Building a Reading Habit</strong><br><br><ul><li><strong>Start with 2 pages</strong>, not a chapter. Lower the bar.</li><li><strong>Replace one scroll session</strong> with reading — same dopamine, better content</li><li><strong>Keep a book visible</strong> everywhere — nightstand, desk, bag</li><li><strong>Read what you enjoy</strong> — don't force "important" books. Fun reads build the habit.</li><li><strong>Audiobooks count!</strong> Listen during commute, walks, or chores</li></ul><br><div class="advice-highlight">📖 Reading 20 pages/day = ~30 books/year. That puts you in the top 5% of readers globally.</div>` },
    { keywords: ['meditat', 'mindful', 'calm', 'stress', 'anxi', 'relax'], response: () => `<strong>🧘 Meditation & Mindfulness</strong><br><br><ul><li><strong>Start with 1 minute.</strong> Set a timer. Just breathe and notice thoughts.</li><li><strong>Use guided apps</strong> initially — structure helps beginners</li><li><strong>Same time, same place</strong> — consistency matters more than duration</li><li><strong>Don't judge "bad" sessions</strong> — noticing distraction IS the practice</li><li><strong>Body scan technique:</strong> Slowly focus attention from toes to head</li></ul><br><div class="advice-highlight">🧠 8 weeks of consistent meditation physically increases gray matter in areas for learning, memory, and emotional regulation (Harvard study, 2011).</div>` },
    { keywords: ['water', 'drink', 'hydrat'], response: () => `<strong>💧 Hydration Habits</strong><br><br><ul><li><strong>Start each morning</strong> with a full glass of water</li><li><strong>Use a marked water bottle</strong> — visual cues work</li><li><strong>Set hourly reminders</strong> until it becomes automatic</li><li><strong>Flavor it:</strong> Lemon, cucumber, or fruit infusions reduce resistance</li><li><strong>Link it:</strong> "Every time I check my phone, I drink water"</li></ul><br><div class="advice-highlight">📊 Even 2% dehydration reduces cognitive performance by 10-15%. Your brain is 75% water.</div>` },
    { keywords: ['focus', 'distract', 'concentration', 'attention', 'phone', 'social media', 'screen'], response: () => `<strong>🎯 Deep Focus Habits</strong><br><br><ul><li><strong>Time blocking:</strong> Dedicate specific hours to deep work</li><li><strong>Phone in another room</strong> — even a visible phone reduces IQ by 10 points (Texas study)</li><li><strong>The Pomodoro Technique:</strong> 25 min work → 5 min break → repeat</li><li><strong>Single-tab browsing</strong> — each open tab costs 10% of your attention</li><li><strong>Batch notifications:</strong> Check messages at set times, not on demand</li></ul><br><div class="advice-highlight">🧠 It takes an average of <strong>23 minutes</strong> to regain deep focus after an interruption (UC Irvine research). Protect your attention fiercely.</div>` },
    { keywords: ['goal', 'plan', 'future', 'success', 'achieve'], response: () => `<strong>🎯 Goal-Setting Meets Habits</strong><br><br>Goals set direction. <strong>Systems</strong> drive progress.<br><br><ul><li><strong>Identity-based goals:</strong> "I want to become a runner" vs "I want to run a marathon"</li><li><strong>Process over outcome:</strong> Focus on "Did I show up?" not "Did I hit the target?"</li><li><strong>Review weekly:</strong> Sunday evening is perfect for a habit review</li><li><strong>Measure lead indicators:</strong> Track habits (inputs), not just results (outputs)</li></ul><br><div class="advice-highlight">📈 "You do not rise to the level of your goals. You fall to the level of your systems." — James Clear</div>` }
  ];

  function getAIContext() {
    const key = dateKey(currentDate);
    const completions = state.completions[key] || {};
    const tasks = state.tasks[key] || [];
    const goodHabits = state.habits.filter(h => h.type !== 'bad');
    const badHabits = state.habits.filter(h => h.type === 'bad');
    const total = state.habits.length + tasks.length;
    let done = state.habits.filter(h => getHabitScore(h, completions)).length;
    done += tasks.filter(t => t.isCompleted).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    // Calculate streak
    let streak = 0;
    const today = new Date();
    resetToMidnight(today);
    const checkDate = new Date(today);
    const todayKey = dateKey(today);
    const todayCompletions = state.completions[todayKey] || {};
    const todayTasks = state.tasks[todayKey] || [];
    const todayDone = state.habits.every(h => getHabitScore(h, todayCompletions)) &&
                      (todayTasks.length === 0 || todayTasks.every(t => t.isCompleted));
    if (!todayDone) checkDate.setDate(checkDate.getDate() - 1);
    while (true) {
      const k = dateKey(checkDate);
      const c = state.completions[k] || {};
      const t = state.tasks[k] || [];
      const allDone = state.habits.length > 0 && state.habits.every(h => getHabitScore(h, c)) &&
                      (t.length === 0 || t.every(x => x.isCompleted));
      if (!allDone) break;
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    if (todayDone && state.habits.length > 0) streak++;

    return {
      total, done, pct, streak,
      goodCount: goodHabits.length,
      badCount: badHabits.length,
      goodHabits, badHabits,
      habitNames: state.habits.map(h => h.name),
      tasks
    };
  }

  function initAIAdvisor() {
    const messagesEl = document.getElementById('aiMessages');
    const inputEl = document.getElementById('aiInput');
    const sendBtn = document.getElementById('aiSendBtn');
    const panel = document.getElementById('aiAdvisorPanel');
    const closeBtn = document.getElementById('aiCloseBtn');
    const fab = document.getElementById('aiFab');
    const toggleBtn = document.getElementById('aiAdvisorToggle');
    const chips = document.querySelectorAll('.ai-chip');

    if (!messagesEl || !inputEl) return;

    // Create backdrop for mobile
    const backdrop = document.createElement('div');
    backdrop.className = 'ai-backdrop';
    backdrop.id = 'aiBackdrop';
    document.body.appendChild(backdrop);

    let isTyping = false;

    function addMessage(content, isUser = false) {
      const msg = document.createElement('div');
      msg.className = `ai-msg${isUser ? ' user-msg' : ''}`;
      msg.innerHTML = `
        <div class="ai-msg-avatar">${isUser ? '👤' : '🧠'}</div>
        <div class="ai-msg-bubble">${content}</div>
      `;
      messagesEl.appendChild(msg);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function showTyping() {
      isTyping = true;
      const typing = document.createElement('div');
      typing.className = 'ai-msg';
      typing.id = 'aiTypingIndicator';
      typing.innerHTML = `
        <div class="ai-msg-avatar">🧠</div>
        <div class="ai-msg-bubble">
          <div class="ai-typing">
            <div class="ai-typing-dot"></div>
            <div class="ai-typing-dot"></div>
            <div class="ai-typing-dot"></div>
          </div>
        </div>
      `;
      messagesEl.appendChild(typing);
      messagesEl.scrollTop = messagesEl.scrollHeight;

      // Update status
      const statusEl = document.getElementById('aiStatus');
      if (statusEl) statusEl.innerHTML = '<span class="ai-status-dot" style="background:var(--warning)"></span> Thinking...';
    }

    function hideTyping() {
      isTyping = false;
      const typing = document.getElementById('aiTypingIndicator');
      if (typing) typing.remove();

      const statusEl = document.getElementById('aiStatus');
      if (statusEl) statusEl.innerHTML = '<span class="ai-status-dot"></span> Ready to help';
    }

    function respondWithDelay(content, delay = 1200) {
      showTyping();
      setTimeout(() => {
        hideTyping();
        addMessage(content);
      }, delay + Math.random() * 800);
    }

    function handleAction(action) {
      const ctx = getAIContext();
      const handlers = AI_KNOWLEDGE[action];
      if (handlers && handlers.length > 0) {
        const handler = handlers[Math.floor(Math.random() * handlers.length)];
        const response = typeof handler === 'function' ? handler(ctx) : handler;
        respondWithDelay(response);
      }
    }

    function handleFreeText(text) {
      const lower = text.toLowerCase();
      
      // Check free-text knowledge base
      for (const entry of FREETEXT_RESPONSES) {
        if (entry.keywords.some(kw => lower.includes(kw))) {
          respondWithDelay(entry.response());
          return;
        }
      }

      // Check action keywords
      const actionMap = {
        'analyze': ['analyze', 'analysis', 'how am i doing', 'progress', 'score', 'dashboard', 'status', 'report'],
        'suggest': ['suggest', 'recommend', 'new habit', 'what should', 'ideas', 'add'],
        'motivation': ['motivat', 'inspire', 'why should', 'give up', 'hard', 'difficult', 'encourage'],
        'streak': ['streak', 'consistent', 'consistency', 'keep going', 'maintain'],
        'science': ['science', 'research', 'how do habits', 'brain', 'neuroscience', 'psychology'],
        'morning': ['morning', 'routine', 'wake up', 'start the day', 'sunrise'],
        'breaking': ['break', 'bad habit', 'stop', 'quit', 'avoid', 'temptation'],
        'stacking': ['stack', 'chain', 'sequence', 'link', 'combine', 'together']
      };

      for (const [action, keywords] of Object.entries(actionMap)) {
        if (keywords.some(kw => lower.includes(kw))) {
          handleAction(action);
          return;
        }
      }

      // Generic response with helpful direction
      const genericResponses = [
        `Great question! While I think about that, here's something actionable:<br><br><div class="advice-highlight">💡 Try the <strong>"Two-Minute Rule"</strong> — any habit can be scaled down to a 2-minute version. "Read a book" becomes "Read one page." Start tiny, build momentum.</div><br>Try clicking one of the quick action chips below for specific advice!`,
        `That's an interesting thought! Let me share something relevant:<br><br><div class="advice-highlight">🔑 <strong>Identity-based habits</strong> are the most powerful. Instead of "I want to read more," say "I am a reader." Every action is a vote for the type of person you wish to become.</div><br>Use the suggestion chips below for personalized advice about your habits!`,
        `I appreciate you thinking about your habits! Here's a powerful insight:<br><br><div class="advice-highlight">🧪 <strong>Environment design</strong> beats willpower every time. Make good habits easy (put the book on your pillow) and bad habits hard (delete the app, don't just log out).</div><br>Try asking me about specific topics like "morning routine", "breaking bad habits", or "motivation"!`
      ];
      respondWithDelay(genericResponses[Math.floor(Math.random() * genericResponses.length)]);
    }

    function sendMessage() {
      const text = inputEl.value.trim();
      if (!text || isTyping) return;
      
      addMessage(text, true);
      inputEl.value = '';
      handleFreeText(text);
    }

    // Toggle panel (mobile)
    function openPanel() {
      panel.classList.add('open');
      backdrop.classList.add('show');
      fab.classList.add('hidden');
      if (toggleBtn) toggleBtn.classList.add('active');
    }

    function closePanel() {
      panel.classList.remove('open');
      backdrop.classList.remove('show');
      fab.classList.remove('hidden');
      if (toggleBtn) toggleBtn.classList.remove('active');
    }

    // Event listeners
    sendBtn.addEventListener('click', sendMessage);
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const action = chip.dataset.action;
        addMessage(chip.textContent.trim(), true);
        handleAction(action);
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    if (fab) fab.addEventListener('click', openPanel);
    if (backdrop) backdrop.addEventListener('click', closePanel);
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const isMobile = window.innerWidth <= 960;
        if (isMobile) {
          if (panel.classList.contains('open')) {
            closePanel();
          } else {
            openPanel();
          }
        }
      });
    }

    // Welcome message
    setTimeout(() => {
      const ctx = getAIContext();
      let welcome = `Hey there! 👋 I'm your <strong>AI Habit Coach</strong>.<br><br>`;
      welcome += `I can see you're tracking <strong>${ctx.total} habit${ctx.total !== 1 ? 's' : ''}</strong>`;
      if (ctx.streak > 0) welcome += ` with a 🔥 <strong>${ctx.streak}-day streak</strong>`;
      welcome += `.<br><br>`;
      welcome += `Ask me anything about building better habits, or try one of the quick actions below!`;
      addMessage(welcome);
    }, 600);
  }

  // Boot AI Advisor after main app
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAIAdvisor);
  } else {
    // Small delay to ensure DOM is ready
    setTimeout(initAIAdvisor, 100);
  }

})();
