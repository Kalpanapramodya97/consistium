const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const User = mongoose.model('User', userSchema);

const habitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
  },
  emoji: {
    type: String,
    default: '🎯',
  },
  type: {
    type: String,
    enum: ['good', 'bad', 'task'],
    default: 'good',
  },
  isNewHabit: {
    type: Boolean,
    default: false
  },
  repeatPattern: {
    type: String,
    enum: ['every_day', 'every_other_day', 'specific_days', 'weekdays', 'weekends', 'custom_interval'],
    default: 'every_day'
  },
  selectedDays: {
    type: [Number],
    default: []
  },
  intervalDays: {
    type: Number,
    default: null
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Habit = mongoose.model('Habit', habitSchema);

// Schema for tracking which habits were completed on which days
const completionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  habit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true
  },
  dateKey: {
    // Stored as YYYY-MM-DD
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Ensure a user can only complete a habit once per day
completionSchema.index({ user: 1, habit: 1, dateKey: 1 }, { unique: true });

const Completion = mongoose.model('Completion', completionSchema);

module.exports = {
  User,
  Habit,
  Completion
};
