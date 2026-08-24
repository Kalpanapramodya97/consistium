/* ============================================
   CONSISTIUM — Atomic Habit Tracker
   Application Logic
   ============================================ */

(function () {
  'use strict';

  // ── Initial Theme Load (default: dark) ──
  const savedTheme = localStorage.getItem('consistium_theme');
  if (savedTheme === 'light') {
    document.documentElement.classList.remove('dark-theme');
  } else {
    document.documentElement.classList.add('dark-theme');
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
    { id: genId(), emoji: '📚', name: 'Read 10 pages', isNew: false, type: 'good', points: 2 },
    { id: genId(), emoji: '💪', name: 'Gym workout', isNew: false, type: 'good', points: 2 },
    { id: genId(), emoji: '🗣️', name: 'Table topic speech', isNew: false, type: 'good', points: 2 },
    { id: genId(), emoji: '💻', name: 'DevOps tutorials × 2', isNew: false, type: 'good', points: 3 },
    { id: genId(), emoji: '📝', name: '12 job applications', isNew: false, type: 'good', points: 5 },
    { id: genId(), emoji: '💼', name: 'Message 5 LinkedIn recruiters & comment on 2 posts', isNew: true, type: 'good', points: 3 },
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
    habitRepeatPattern: $('#habitRepeatPattern'),
    habitSpecificDaysGroup: $('#habitSpecificDaysGroup'),
    habitIntervalGroup: $('#habitIntervalGroup'),
    habitIntervalDays: $('#habitIntervalDays'),
    habitStartDate: $('#habitStartDate'),
    dayOpts: $$('.day-opt input[type="checkbox"]'),
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
    pointsEarned: $('#pointsEarned'),
    habitPoints: $('#habitPoints'),
    diffOpts: $$('.diff-opt'),
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
    adminUserList: $('#adminUserList'),
    // Discipline
    disciplineSection: $('#disciplineSection'),
    disciplineLevelName: $('#disciplineLevelName'),
    disciplineCurrentStreak: $('#disciplineCurrentStreak'),
    disciplineLongestStreak: $('#disciplineLongestStreak'),
    disciplineTotalDays: $('#disciplineTotalDays'),
    disciplineProgressText: $('#disciplineProgressText'),
    disciplineProgressFill: $('#disciplineProgressFill'),
    // Identity
    identitySection: $('#identitySection'),
    identityCards: $('#identityCards'),
    identityEmpty: $('#identityEmpty'),
    addIdentityBtn: $('#addIdentityBtn'),
    identityModal: $('#identityModal'),
    identityModalTitle: $('#identityModalTitle'),
    identityCloseBtn: $('#identityCloseBtn'),
    identityForm: $('#identityForm'),
    identityEmojiPicker: $('#identityEmojiPicker'),
    identityEmoji: $('#identityEmoji'),
    identityStatement: $('#identityStatement'),
    identityHabitLinker: $('#identityHabitLinker'),
    identityHabitEmpty: $('#identityHabitEmpty'),
    identityEditId: $('#identityEditId'),
    saveIdentityBtn: $('#saveIdentityBtn'),
    deleteIdentityBtn: $('#deleteIdentityBtn'),
    habitIdentityGroup: $('#habitIdentityGroup'),
    habitIdentityTags: $('#habitIdentityTags'),
    habitIdentityEmpty: $('#habitIdentityEmpty')
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

  function shouldHabitAppearOnDate(habit, date) {
    if (habit.type === 'task') return true;
    
    const pattern = habit.repeatPattern || 'every_day';
    const startDate = habit.startDate ? new Date(habit.startDate) : new Date(0);
    resetToMidnight(startDate);
    const d = new Date(date);
    resetToMidnight(d);

    if (d < startDate) return false;

    const dayOfWeek = d.getDay();

    if (pattern === 'every_day') return true;
    if (pattern === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
    if (pattern === 'weekends') return dayOfWeek === 0 || dayOfWeek === 6;
    if (pattern === 'specific_days') {
      const days = habit.selectedDays || [];
      return days.includes(dayOfWeek);
    }
    
    const diffTime = Math.abs(d - startDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (pattern === 'every_other_day') {
      return diffDays % 2 === 0;
    }
    if (pattern === 'custom_interval') {
      const interval = habit.intervalDays || 2;
      return diffDays % interval === 0;
    }

    return true;
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
        isNew: h.isNewHabit,
        points: h.points || 1,
        repeatPattern: h.repeatPattern,
        selectedDays: h.selectedDays,
        intervalDays: h.intervalDays,
        startDate: h.startDate
      }));
      
      // We'd ideally fetch completions for all days in state, but let's fetch today's at least
      const todayKey = dateKey(currentDate);
      const completions = await apiFetch(`/habits/completions/${todayKey}`);
      state.completions[todayKey] = {};
      completions.forEach(cid => {
        state.completions[todayKey][cid] = true;
      });

      renderAll();
      fetchAndRenderDisciplineStats();
    } catch (e) {
      console.error('Sync failed', e);
    }
  }

  async function fetchAndRenderDisciplineStats() {
    if (!dom.disciplineSection) return;
    
    let stats;
    if (authToken) {
      try {
        const todayKey = dateKey(new Date());
        stats = await apiFetch(`/discipline-stats?today=${todayKey}`);
      } catch (e) {
        console.error('Failed to fetch discipline stats', e);
        return;
      }
    } else {
      stats = calculateLocalDisciplineStats();
    }
      
    dom.disciplineSection.style.display = 'block';
    dom.disciplineLevelName.textContent = stats.currentLevel.name;
    dom.disciplineCurrentStreak.textContent = stats.currentStreak;
    dom.disciplineLongestStreak.textContent = stats.longestStreak;
    dom.disciplineTotalDays.textContent = stats.totalPerfectDays;
    
    if (stats.nextLevel) {
      dom.disciplineProgressText.textContent = `${stats.daysToNextLevel} more perfect days to become ${stats.nextLevel.name}`;
      dom.disciplineProgressFill.style.width = `${stats.progressPercent}%`;
    } else {
      dom.disciplineProgressText.textContent = `Max level reached! You are a legend.`;
      dom.disciplineProgressFill.style.width = `100%`;
    }
  }

  function calculateLocalDisciplineStats() {
    const LEVELS = [
      { name: 'Beginner', requiredStreak: 0 },
      { name: 'Discipline Guy', requiredStreak: 3 },
      { name: 'Consistent Guy', requiredStreak: 7 },
      { name: 'Ultra Discipline Guy', requiredStreak: 14 },
      { name: 'Iron Mind', requiredStreak: 30 },
      { name: 'Beast Mode', requiredStreak: 60 },
      { name: 'Legend', requiredStreak: 100 }
    ];

    let currentStreak = 0;
    let longestStreak = 0;
    let totalPerfectDays = 0;

    const habits = state.habits;
    const completionsMap = state.completions;
    const today = new Date();
    const todayKey = dateKey(today);

    let earliestDateKey = todayKey;
    Object.keys(completionsMap).forEach(key => {
      if (key < earliestDateKey) earliestDateKey = key;
    });
    habits.forEach(h => {
      if (h.startDate) {
        const sd = new Date(h.startDate);
        const y = sd.getFullYear();
        const m = String(sd.getMonth() + 1).padStart(2, '0');
        const d = String(sd.getDate()).padStart(2, '0');
        const dKey = `${y}-${m}-${d}`;
        if (dKey < earliestDateKey) earliestDateKey = dKey;
      }
    });

    if (habits.length > 0) {
      const end = new Date(today);
      resetToMidnight(end);
      let current = new Date(earliestDateKey);
      resetToMidnight(current);

      while (current <= end) {
        const dKey = dateKey(current);
        const activeHabits = habits.filter(h => shouldHabitAppearOnDate(h, current));
        
        if (activeHabits.length === 0) {
          current.setDate(current.getDate() + 1);
          continue;
        }

        let isPerfect = activeHabits.every(h => {
          const isCompleted = completionsMap[dKey] && completionsMap[dKey][h.id];
          if (h.type === 'bad') return !isCompleted;
          return !!isCompleted;
        });

        if (isPerfect) {
          currentStreak++;
          totalPerfectDays++;
          if (currentStreak > longestStreak) longestStreak = currentStreak;
        } else {
          if (dKey !== todayKey) currentStreak = 0;
        }

        current.setDate(current.getDate() + 1);
      }
    }

    let currentLevel = LEVELS[0];
    let nextLevel = LEVELS[1];
    for (let i = 0; i < LEVELS.length; i++) {
      if (currentStreak >= LEVELS[i].requiredStreak) {
        currentLevel = LEVELS[i];
        nextLevel = i + 1 < LEVELS.length ? LEVELS[i + 1] : null;
      }
    }

    let daysToNextLevel = 0;
    let progressPercent = 100;
    if (nextLevel) {
      daysToNextLevel = nextLevel.requiredStreak - currentStreak;
      const prevReq = currentLevel.requiredStreak;
      const totalReq = nextLevel.requiredStreak - prevReq;
      progressPercent = Math.round(((currentStreak - prevReq) / totalReq) * 100);
    }

    return {
      currentStreak, longestStreak, totalPerfectDays, currentLevel, nextLevel, daysToNextLevel, progressPercent
    };
  }

  function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('consistium_token');
    state = { habits: DEFAULT_HABITS, completions: {}, tasks: {} };
    dom.adminBtn.style.display = 'none';
    if (dom.disciplineSection) dom.disciplineSection.style.display = 'none';
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
          // Migrate: ensure all habits have a points value (default Easy = 1)
          parsed.habits = parsed.habits.map(h => ({
            points: 1,
            ...h
          }));
          // Migrate: add identities array
          parsed.identities = parsed.identities || [];
          return parsed;
        }
      }
    } catch (e) { /* ignore */ }
    return {
      habits: DEFAULT_HABITS,
      completions: {},
      tasks: {},
      identities: []
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
    stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', '#f3d38f');
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%'); stop2.setAttribute('stop-color', '#52ba75');

    grad.appendChild(stop1);
    grad.appendChild(stop2);
    defs.appendChild(grad);
    svg.insertBefore(defs, svg.firstChild);

    // Identity ring gradient
    const defs2 = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const grad2 = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad2.setAttribute('id', 'identityGradient');
    grad2.setAttribute('x1', '0%'); grad2.setAttribute('y1', '0%');
    grad2.setAttribute('x2', '100%'); grad2.setAttribute('y2', '100%');
    const iStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    iStop1.setAttribute('offset', '0%'); iStop1.setAttribute('stop-color', '#f3d38f');
    const iStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    iStop2.setAttribute('offset', '100%'); iStop2.setAttribute('stop-color', '#e5b869');
    grad2.appendChild(iStop1);
    grad2.appendChild(iStop2);
    defs2.appendChild(grad2);
    // Add to body so it can be referenced anywhere
    const hiddenSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    hiddenSvg.style.width = '0'; hiddenSvg.style.height = '0'; hiddenSvg.style.position = 'absolute';
    hiddenSvg.appendChild(defs2);
    document.body.appendChild(hiddenSvg);
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

    const activeHabits = state.habits.filter(h => shouldHabitAppearOnDate(h, currentDate));
    const total = activeHabits.length + todayTasks.length;

    // Count-based (for displaying X/Y completed)
    let done = activeHabits.filter(h => getHabitScore(h, completions)).length;
    done += todayTasks.filter(t => t.isCompleted).length;

    // Points-based (for the score percentage)
    const totalPoints = activeHabits.reduce((sum, h) => sum + (h.points || 1), 0)
                      + todayTasks.reduce((sum, t) => sum + (t.points || 1), 0);
    const earnedPoints = activeHabits
                          .filter(h => getHabitScore(h, completions))
                          .reduce((sum, h) => sum + (h.points || 1), 0)
                       + todayTasks
                          .filter(t => t.isCompleted)
                          .reduce((sum, t) => sum + (t.points || 1), 0);

    const pct = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    animateValue(dom.scorePercent, pct, '%');

    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (pct / 100) * circumference;
    dom.scoreRingFill.style.strokeDashoffset = offset;

    dom.habitsTracked.textContent = total;
    dom.habitsCompleted.textContent = `${done}/${total}`;
    if (dom.pointsEarned) dom.pointsEarned.textContent = `${earnedPoints}/${totalPoints} pts`;

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
          <span class="points-badge">${habit.points || 1} pt${(habit.points || 1) !== 1 ? 's' : ''}</span>
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

    const activeHabits = state.habits.filter(h => shouldHabitAppearOnDate(h, currentDate));
    const goodHabits = activeHabits.filter(h => h.type !== 'bad');
    const badHabits = activeHabits.filter(h => h.type === 'bad');

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

  // ── Identity Dashboard ──
  const IDENTITY_LEVELS = [
    { name: 'Seedling', class: 'level-seedling', minVotes: 0 },
    { name: 'Growing', class: 'level-growing', minVotes: 10 },
    { name: 'Strong', class: 'level-strong', minVotes: 30 },
    { name: 'Rooted', class: 'level-rooted', minVotes: 60 },
    { name: 'Unshakeable', class: 'level-unshakeable', minVotes: 100 }
  ];

  function calculateIdentityVotes(identity) {
    let totalVotes = 0;
    const habitIds = identity.habitIds || [];
    
    // Scan all days in history
    const allDates = new Set();
    Object.keys(state.completions).forEach(k => allDates.add(k));
    
    // Also add dates since habit start dates if they are bad habits
    habitIds.forEach(id => {
      const h = state.habits.find(hx => hx.id === id);
      if (h && h.type === 'bad' && h.startDate) {
        let cur = new Date(h.startDate);
        resetToMidnight(cur);
        const today = new Date();
        resetToMidnight(today);
        while(cur <= today) {
          allDates.add(dateKey(cur));
          cur.setDate(cur.getDate() + 1);
        }
      }
    });

    Array.from(allDates).forEach(dKey => {
      const dateObj = new Date(dKey);
      resetToMidnight(dateObj);
      const comps = state.completions[dKey] || {};
      
      habitIds.forEach(hId => {
        const habit = state.habits.find(h => h.id === hId);
        if (!habit) return;
        if (!shouldHabitAppearOnDate(habit, dateObj)) return;
        
        if (habit.type === 'bad') {
          // For bad habits: NOT doing it = a vote
          if (!comps[hId]) totalVotes++;
        } else {
          // Good habit / Task: Doing it = a vote
          if (comps[hId]) totalVotes++;
        }
      });
    });
    return totalVotes;
  }

  function getIdentityLevel(votes) {
    let lvl = IDENTITY_LEVELS[0];
    let nextLvl = IDENTITY_LEVELS[1];
    for (let i = 0; i < IDENTITY_LEVELS.length; i++) {
      if (votes >= IDENTITY_LEVELS[i].minVotes) {
        lvl = IDENTITY_LEVELS[i];
        nextLvl = i + 1 < IDENTITY_LEVELS.length ? IDENTITY_LEVELS[i + 1] : null;
      }
    }
    return { current: lvl, next: nextLvl };
  }

  function renderIdentityDashboard() {
    dom.identityCards.innerHTML = '';
    const identities = state.identities || [];
    
    if (identities.length === 0) {
      dom.identityEmpty.style.display = 'block';
      return;
    }
    
    dom.identityEmpty.style.display = 'none';
    
    identities.forEach((idty, index) => {
      const votes = calculateIdentityVotes(idty);
      const levelInfo = getIdentityLevel(votes);
      
      let nextLevelHtml = '';
      let progressHtml = '';
      let pct = 100;
      
      if (levelInfo.next) {
        const votesNeeded = levelInfo.next.minVotes - levelInfo.current.minVotes;
        const votesEarned = votes - levelInfo.current.minVotes;
        const remaining = levelInfo.next.minVotes - votes;
        pct = Math.round((votesEarned / votesNeeded) * 100);
        
        nextLevelHtml = `<div class="identity-next-level">${remaining} more to ${levelInfo.next.name}</div>`;
        progressHtml = `
          <div class="identity-progress-bar">
            <div class="identity-progress-fill" style="width: ${pct}%"></div>
          </div>
        `;
      } else {
        nextLevelHtml = `<div class="identity-next-level">Max level reached!</div>`;
        progressHtml = `
          <div class="identity-progress-bar">
            <div class="identity-progress-fill" style="width: 100%"></div>
          </div>
        `;
      }
      
      const circumference = 2 * Math.PI * 26; // r=26
      const offset = circumference - (pct / 100) * circumference;
      
      const linkedHabitsHtml = (idty.habitIds || []).map(hId => {
        const h = state.habits.find(hx => hx.id === hId);
        if (!h) return '';
        return `<span class="identity-habit-pill"><span class="identity-habit-pill-emoji">${h.emoji}</span> ${h.name}</span>`;
      }).join('');
      
      const card = document.createElement('div');
      card.className = 'identity-card';
      card.style.animationDelay = `${index * 0.1}s`;
      card.innerHTML = `
        <div class="identity-ring-container">
          <svg class="identity-ring" viewBox="0 0 64 64">
            <circle class="identity-ring-bg" cx="32" cy="32" r="26" />
            <circle class="identity-ring-fill" cx="32" cy="32" r="26" style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset};" />
          </svg>
          <div class="identity-ring-emoji">${idty.emoji}</div>
        </div>
        <div class="identity-info">
          <div class="identity-statement">
            I am a ${idty.statement}
            <span class="identity-level-badge ${levelInfo.current.class}">${levelInfo.current.name}</span>
          </div>
          <div class="identity-meta">
            <div class="identity-votes"><span class="identity-vote-count">${votes}</span> votes</div>
            ${nextLevelHtml}
          </div>
          ${progressHtml}
          ${linkedHabitsHtml ? `<div class="identity-habits">${linkedHabitsHtml}</div>` : ''}
        </div>
        <button class="identity-edit-btn" data-id="${idty.id}" title="Edit Identity">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      `;
      
      card.querySelector('.identity-edit-btn').addEventListener('click', () => {
        openEditIdentityModal(idty);
      });
      
      dom.identityCards.appendChild(card);
    });
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
      
      const activeHabits = state.habits.filter(h => shouldHabitAppearOnDate(h, d));
      const total = activeHabits.length + tasks.length;
      let done = activeHabits.filter(h => getHabitScore(h, completions)).length;
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
    renderWeeklyHeatmap();
    renderQuote();
    fetchAndRenderDisciplineStats();
    renderIdentityDashboard();
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
  function updateRepeatUI() {
    const val = dom.habitRepeatPattern.value;
    dom.habitSpecificDaysGroup.style.display = val === 'specific_days' ? 'block' : 'none';
    dom.habitIntervalGroup.style.display = val === 'custom_interval' ? 'block' : 'none';
  }

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

    dom.habitRepeatPattern.value = 'every_day';
    dom.habitIntervalDays.value = '2';
    dom.habitStartDate.value = new Date().toISOString().split('T')[0];
    dom.dayOpts.forEach(opt => opt.checked = false);
    updateRepeatUI();

    // Reset difficulty to Easy (1 pt)
    dom.habitPoints.value = '1';
    dom.diffOpts.forEach(b => b.classList.toggle('selected', b.dataset.points === '1'));

    setModalType('good');
    
    // Load Identity tags
    dom.habitIdentityGroup.style.display = 'block';
    renderIdentityTagSelector([]);
    
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

    dom.habitRepeatPattern.value = habit.repeatPattern || 'every_day';
    dom.habitIntervalDays.value = habit.intervalDays || '2';
    if (habit.startDate) {
      dom.habitStartDate.value = new Date(habit.startDate).toISOString().split('T')[0];
    } else {
      dom.habitStartDate.value = new Date().toISOString().split('T')[0];
    }
    const days = habit.selectedDays || [];
    dom.dayOpts.forEach(opt => {
      opt.checked = days.includes(parseInt(opt.value, 10));
    });
    updateRepeatUI();

    // Set difficulty selector to match saved points
    const pts = String(habit.points || 1);
    dom.habitPoints.value = pts;
    dom.diffOpts.forEach(b => b.classList.toggle('selected', b.dataset.points === pts));

    // Load Identity tags
    dom.habitIdentityGroup.style.display = 'block';
    const linkedIdentityIds = (state.identities || [])
      .filter(idty => idty.habitIds.includes(habit.id))
      .map(idty => idty.id);
    renderIdentityTagSelector(linkedIdentityIds);

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
    const points = parseInt(dom.habitPoints.value, 10) || 1;

    const repeatPattern = dom.habitRepeatPattern.value;
    const intervalDays = parseInt(dom.habitIntervalDays.value, 10);
    const startDate = new Date(dom.habitStartDate.value);
    const selectedDays = Array.from(dom.dayOpts).filter(opt => opt.checked).map(opt => parseInt(opt.value, 10));

    if (type === 'task') {
      const key = dateKey(currentDate);
      if (!state.tasks[key]) state.tasks[key] = [];
      if (editId) {
        const task = state.tasks[key].find(t => t.id === editId);
        if (task) {
          task.name = name;
          task.emoji = emoji;
          task.points = points;
        }
      } else {
        state.tasks[key].push({ id: genId(), emoji, name, isCompleted: false, points });
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
              body: JSON.stringify({ name, emoji, type, isNewHabit: isNew, repeatPattern, selectedDays, intervalDays, startDate })
            });
          } else {
            await apiFetch('/habits', {
              method: 'POST',
              body: JSON.stringify({ name, emoji, type, isNewHabit: isNew, repeatPattern, selectedDays, intervalDays, startDate })
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
              habit.points = points;
              habit.repeatPattern = repeatPattern;
              habit.selectedDays = selectedDays;
              habit.intervalDays = intervalDays;
              habit.startDate = startDate;
            }
          } else {
            const newId = genId();
            state.habits.push({ id: newId, emoji, name, isNew, type, points, repeatPattern, selectedDays, intervalDays, startDate });
            // For new habits, we need to pass the ID to the identity tagger
            dom.habitEditId.value = newId; 
          }
          
          // Update Identity linkages
          const targetHabitId = dom.habitEditId.value;
          const selectedIdentityIds = Array.from(dom.habitIdentityTags.querySelectorAll('input:checked')).map(inp => inp.value);
          
          if (state.identities) {
            state.identities.forEach(idty => {
              const hasHabit = idty.habitIds.includes(targetHabitId);
              const shouldHave = selectedIdentityIds.includes(idty.id);
              
              if (shouldHave && !hasHabit) {
                idty.habitIds.push(targetHabitId);
              } else if (!shouldHave && hasHabit) {
                idty.habitIds = idty.habitIds.filter(id => id !== targetHabitId);
              }
            });
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

  // ── Identity CRUD ──
  function renderIdentityTagSelector(selectedIds = []) {
    const identities = state.identities || [];
    dom.habitIdentityTags.innerHTML = '';
    
    if (identities.length === 0) {
      dom.habitIdentityEmpty.style.display = 'block';
      return;
    }
    
    dom.habitIdentityEmpty.style.display = 'none';
    
    identities.forEach(idty => {
      const isSelected = selectedIds.includes(idty.id);
      const lbl = document.createElement('label');
      lbl.className = `identity-tag-opt ${isSelected ? 'selected' : ''}`;
      lbl.innerHTML = `
        <input type="checkbox" value="${idty.id}" ${isSelected ? 'checked' : ''}>
        ${idty.emoji} ${idty.statement}
      `;
      lbl.querySelector('input').addEventListener('change', function() {
        lbl.classList.toggle('selected', this.checked);
      });
      dom.habitIdentityTags.appendChild(lbl);
    });
  }

  function renderIdentityHabitLinker(selectedHabitIds = []) {
    dom.identityHabitLinker.innerHTML = '';
    const habits = state.habits || [];
    
    if (habits.length === 0) {
      dom.identityHabitEmpty.style.display = 'block';
      return;
    }
    
    dom.identityHabitEmpty.style.display = 'none';
    
    habits.forEach(h => {
      const isSelected = selectedHabitIds.includes(h.id);
      const label = document.createElement('label');
      label.className = `identity-link-opt ${isSelected ? 'selected' : ''}`;
      label.innerHTML = `
        <input type="checkbox" value="${h.id}" ${isSelected ? 'checked' : ''} />
        <span class="identity-link-emoji">${h.emoji}</span>
        <span class="identity-link-name">${h.name}</span>
      `;
      
      label.querySelector('input').addEventListener('change', function() {
        label.classList.toggle('selected', this.checked);
      });
      
      dom.identityHabitLinker.appendChild(label);
    });
  }

  function openAddIdentityModal() {
    dom.identityModalTitle.textContent = 'Add Identity';
    dom.saveIdentityBtn.textContent = 'Add Identity';
    dom.deleteIdentityBtn.style.display = 'none';
    dom.identityStatement.value = '';
    dom.identityEditId.value = '';
    
    $$('.identity-emoji-opt').forEach(b => b.classList.remove('selected'));
    const def = document.querySelector('.identity-emoji-opt[data-emoji="🪞"]');
    if (def) def.classList.add('selected');
    dom.identityEmoji.value = '🪞';
    
    renderIdentityHabitLinker([]);
    
    dom.identityModal.style.display = 'flex';
    dom.identityStatement.focus();
  }

  function openEditIdentityModal(identity) {
    dom.identityModalTitle.textContent = 'Edit Identity';
    dom.saveIdentityBtn.textContent = 'Save Changes';
    dom.deleteIdentityBtn.style.display = 'block';
    dom.identityStatement.value = identity.statement;
    dom.identityEditId.value = identity.id;
    
    $$('.identity-emoji-opt').forEach(b => b.classList.remove('selected'));
    const emojiOpt = document.querySelector(`.identity-emoji-opt[data-emoji="${identity.emoji}"]`);
    if (emojiOpt) emojiOpt.classList.add('selected');
    dom.identityEmoji.value = identity.emoji;
    
    renderIdentityHabitLinker(identity.habitIds || []);
    
    dom.identityModal.style.display = 'flex';
    dom.identityStatement.focus();
  }

  function closeIdentityModal() {
    dom.identityModal.style.display = 'none';
  }

  function saveIdentity(e) {
    e.preventDefault();
    const statement = dom.identityStatement.value.trim();
    if (!statement) return;
    
    const editId = dom.identityEditId.value;
    const emoji = dom.identityEmoji.value;
    const linkedHabitIds = Array.from(dom.identityHabitLinker.querySelectorAll('input:checked')).map(cb => cb.value);
    
    state.identities = state.identities || [];
    
    if (editId) {
      const idty = state.identities.find(i => i.id === editId);
      if (idty) {
        idty.statement = statement;
        idty.emoji = emoji;
        idty.habitIds = linkedHabitIds;
      }
    } else {
      state.identities.push({
        id: genId(),
        emoji,
        statement,
        habitIds: linkedHabitIds,
        createdAt: new Date().toISOString()
      });
    }
    
    saveState();
    renderAll();
    closeIdentityModal();
  }

  function deleteIdentity() {
    const editId = dom.identityEditId.value;
    if (!editId) return;
    if (!confirm('Delete this identity? Your habits will not be deleted.')) return;
    
    state.identities = state.identities.filter(i => i.id !== editId);
    saveState();
    renderAll();
    closeIdentityModal();
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
    dom.habitRepeatPattern.addEventListener('change', updateRepeatUI);

    // Identity Modal
    dom.addIdentityBtn.addEventListener('click', openAddIdentityModal);
    dom.identityCloseBtn.addEventListener('click', closeIdentityModal);
    dom.identityModal.addEventListener('click', (e) => {
      if (e.target === dom.identityModal) closeIdentityModal();
    });
    dom.identityForm.addEventListener('submit', saveIdentity);
    dom.deleteIdentityBtn.addEventListener('click', deleteIdentity);
    
    $$('.identity-emoji-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.identity-emoji-opt').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        dom.identityEmoji.value = btn.dataset.emoji;
      });
    });

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

    // Difficulty selector
    dom.diffOpts.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.diffOpts.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        dom.habitPoints.value = btn.dataset.points;
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
  }

})();
