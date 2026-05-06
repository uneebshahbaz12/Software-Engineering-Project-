const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/profiles', require('./routes/profile.routes'));
app.use('/api/onboarding', require('./routes/onboarding.routes'));
app.use('/api/content', require('./routes/content.routes'));
app.use('/api/scholars', require('./routes/scholar.routes'));
app.use('/api/topics', require('./routes/topic.routes'));
app.use('/api/books', require('./routes/book.routes'));
app.use('/api/watchlist', require('./routes/watchlist.routes'));
app.use('/api/history', require('./routes/history.routes'));
app.use('/api/gatherings', require('./routes/gathering.routes'));
app.use('/api/external', require('./routes/external.routes'));
app.use('/api/sync', require('./routes/sync.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Islam Learning Platform API is running', timestamp: new Date() });
});

// Error handler
app.use(errorHandler);

module.exports = app;
