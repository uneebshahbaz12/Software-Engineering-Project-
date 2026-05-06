const auth = require('./auth');
const { ILP_SYNC_SECRET } = require('../config/env');

/**
 * If ILP_SYNC_SECRET is set in .env, require header `X-ILP-Sync-Secret` to match (for cron / CI).
 * Otherwise require a normal JWT (same as other protected routes).
 */
module.exports = function syncAuth(req, res, next) {
  if (ILP_SYNC_SECRET) {
    const h = req.headers['x-ilp-sync-secret'];
    if (h && h === ILP_SYNC_SECRET) return next();
    return res.status(401).json({ success: false, message: 'Invalid or missing X-ILP-Sync-Secret' });
  }
  return auth(req, res, next);
};
