const express = require('express');
const router = express.Router();
const { Habit, Completion } = require('../models');
const { protect } = require('../middleware/auth');

// Apply middleware to all routes
router.use(protect);

// @route   GET /api/habits
// @desc    Get all habits for current user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user.id });
    res.json(habits);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/habits
// @desc    Create a habit
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { name, emoji, type, isNewHabit } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Habit name is required' });
    }

    const habit = await Habit.create({
      user: req.user.id,
      name,
      emoji: emoji || '🎯',
      type: type || 'good',
      isNewHabit: isNewHabit || false
    });

    res.status(201).json(habit);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/habits/:id
// @desc    Update a habit
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Make sure the logged in user matches the habit user
    if (habit.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const updatedHabit = await Habit.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedHabit);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/habits/:id
// @desc    Delete a habit
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    if (habit.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Delete associated completions
    await Completion.deleteMany({ habit: req.params.id });
    await Habit.findByIdAndDelete(req.params.id);

    res.json({ id: req.params.id, message: 'Habit deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// --- COMPLETIONS ---

// @route   GET /api/habits/completions/:dateKey
// @desc    Get completions for a specific date (YYYY-MM-DD)
// @access  Private
router.get('/completions/:dateKey', async (req, res) => {
  try {
    const completions = await Completion.find({
      user: req.user.id,
      dateKey: req.params.dateKey
    }).populate('habit', 'name type');
    
    // Return an array of completed habit IDs for the frontend
    const completedHabitIds = completions.map(c => c.habit._id.toString());
    
    res.json(completedHabitIds);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/habits/completions
// @desc    Toggle a habit completion for a specific date
// @access  Private
router.post('/completions', async (req, res) => {
  try {
    const { habitId, dateKey } = req.body;

    if (!habitId || !dateKey) {
      return res.status(400).json({ message: 'habitId and dateKey are required' });
    }

    // Check if habit exists and belongs to user
    const habit = await Habit.findById(habitId);
    if (!habit || habit.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Check if completion exists
    const existingCompletion = await Completion.findOne({
      user: req.user.id,
      habit: habitId,
      dateKey
    });

    if (existingCompletion) {
      // Toggle off (delete)
      await Completion.findByIdAndDelete(existingCompletion._id);
      res.json({ status: 'removed', habitId, dateKey });
    } else {
      // Toggle on (create)
      const completion = await Completion.create({
        user: req.user.id,
        habit: habitId,
        dateKey
      });
      res.status(201).json({ status: 'added', habitId, dateKey });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
