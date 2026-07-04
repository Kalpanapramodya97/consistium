const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoSanitize = require('express-mongo-sanitize');
const { metricsMiddleware, metricsHandler } = require('./middleware/metrics');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
// Strip MongoDB operator keys ($, .) from user input — prevents NoSQL injection
app.use(mongoSanitize());

// ── Prometheus instrumentation ────────────────────────────────────────────────
// Must be registered BEFORE routes so every request is measured.
app.use(metricsMiddleware);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/consistium';

if (require.main === module) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));
}

// Routes (to be imported)
const authRoutes = require('./routes/auth');
const habitRoutes = require('./routes/habits');
const adminRoutes = require('./routes/admin');
const disciplineRoutes = require('./routes/discipline');

app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/discipline-stats', disciplineRoutes.router);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Consistium API is running' });
});

// ── Prometheus metrics endpoint ───────────────────────────────────────────────
// Scraped by Prometheus every 15 s (see prometheus/prometheus.yml).
app.get('/api/metrics', metricsHandler);

// Start Server
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Metrics available at http://localhost:${PORT}/api/metrics`);
  });
}

module.exports = app;

