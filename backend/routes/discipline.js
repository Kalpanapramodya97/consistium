const express = require('express');
const router = express.Router();
const { Habit, Completion } = require('../models');
const { protect } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// Apply middleware to all routes
router.use(apiLimiter);
router.use(protect);

// Discipline Levels definition
const LEVELS = [
  { name: 'Beginner', requiredStreak: 0 },
  { name: 'Discipline Guy', requiredStreak: 3 },
  { name: 'Consistent Guy', requiredStreak: 7 },
  { name: 'Ultra Discipline Guy', requiredStreak: 14 },
  { name: 'Iron Mind', requiredStreak: 30 },
  { name: 'Beast Mode', requiredStreak: 60 },
  { name: 'Legend', requiredStreak: 100 }
];

function shouldHabitAppearOnDate(habit, date) {
  if (habit.type === 'task') return true;

  const pattern = habit.repeatPattern || 'every_day';
  const startDate = habit.startDate ? new Date(habit.startDate) : new Date(0);
  startDate.setUTCHours(0, 0, 0, 0);
  
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);

  if (d < startDate) return false;

  const dayOfWeek = d.getUTCDay();

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

// Function to generate date strings from start to end (inclusive)
function generateDateRange(startStr, endStr) {
  const dates = [];
  let current = new Date(startStr);
  const end = new Date(endStr);
  
  while (current <= end) {
    const y = current.getUTCFullYear();
    const m = String(current.getUTCMonth() + 1).padStart(2, '0');
    const d = String(current.getUTCDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

function calculateDisciplineStats(habits, completions, todayKey) {
  const completionsMap = {};
  let earliestDateKey = todayKey;

  completions.forEach(c => {
    if (!completionsMap[c.dateKey]) {
      completionsMap[c.dateKey] = {};
    }
    const habitIdStr = c.habit._id ? c.habit._id.toString() : c.habit.toString();
    completionsMap[c.dateKey][habitIdStr] = true;
    if (c.dateKey < earliestDateKey) {
      earliestDateKey = c.dateKey;
    }
  });

  habits.forEach(h => {
    if (h.startDate) {
      const sd = new Date(h.startDate);
      const y = sd.getUTCFullYear();
      const m = String(sd.getUTCMonth() + 1).padStart(2, '0');
      const d = String(sd.getUTCDate()).padStart(2, '0');
      const dKey = `${y}-${m}-${d}`;
      if (dKey < earliestDateKey) earliestDateKey = dKey;
    }
  });

  let currentStreak = 0;
  let longestStreak = 0;
  let totalPerfectDays = 0;
  
  if (habits.length > 0) {
    const dateKeys = generateDateRange(earliestDateKey, todayKey);
    
    for (const dKey of dateKeys) {
      const activeHabits = habits.filter(h => shouldHabitAppearOnDate(h, new Date(dKey)));
      
      if (activeHabits.length === 0) {
        continue;
      }
      
      let isPerfect = activeHabits.every(h => {
        const hid = h._id ? h._id.toString() : h.id.toString();
        const isCompleted = completionsMap[dKey] && completionsMap[dKey][hid];
        if (h.type === 'bad') {
          return !isCompleted;
        }
        return !!isCompleted;
      });
      
      if (isPerfect) {
        currentStreak++;
        totalPerfectDays++;
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
      } else {
        if (dKey !== todayKey) {
          currentStreak = 0;
        }
      }
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
    const prevRequirement = currentLevel.requiredStreak;
    const totalRequiredForNext = nextLevel.requiredStreak - prevRequirement;
    const progressed = currentStreak - prevRequirement;
    progressPercent = Math.round((progressed / totalRequiredForNext) * 100);
  }

  return {
    currentStreak,
    longestStreak,
    totalPerfectDays,
    currentLevel,
    nextLevel,
    daysToNextLevel,
    progressPercent
  };
}

// @route   GET /api/discipline-stats
// @desc    Get discipline levels and streak stats
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { today } = req.query; // format YYYY-MM-DD
    
    // Default to today in UTC if not provided
    let todayKey = today;
    if (!todayKey) {
      const t = new Date();
      const y = t.getUTCFullYear();
      const m = String(t.getUTCMonth() + 1).padStart(2, '0');
      const d = String(t.getUTCDate()).padStart(2, '0');
      todayKey = `${y}-${m}-${d}`;
    }

    const habits = await Habit.find({ user: req.user.id });
    const completions = await Completion.find({ user: req.user.id });

    const stats = calculateDisciplineStats(habits, completions, todayKey);
    res.json(stats);

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = { router, calculateDisciplineStats };
