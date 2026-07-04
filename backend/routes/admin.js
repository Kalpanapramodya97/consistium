const express = require('express');
const router = express.Router();
const { User, Habit, Completion } = require('../models');
const { protect, admin } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimiter');

// Apply middleware to all routes
router.use(adminLimiter);
router.use(protect);
router.use(admin);

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Private/Admin
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent admin from deleting themselves easily, or just allow it. Let's allow but ensure we know.
    if (user._id.toString() === req.user._id.toString()) {
       return res.status(400).json({ message: 'Cannot delete your own admin account directly here.' });
    }

    // Delete user's habits and completions
    await Habit.deleteMany({ user: req.params.id });
    await Completion.deleteMany({ user: req.params.id });

    // Delete user
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/stats
// @desc    Get system stats
// @access  Private/Admin
router.get('/stats', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const habitCount = await Habit.countDocuments();
    const completionCount = await Completion.countDocuments();

    res.json({
      users: userCount,
      habits: habitCount,
      completions: completionCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
