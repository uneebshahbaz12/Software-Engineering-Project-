const dotenv = require('dotenv');
const path = require('path');

// Prefer server/.env for backend secrets, then fallback to repo-root .env.
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || '',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_SECURE: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'no-reply@islam-learning-platform.app',
  BACKEND_PUBLIC_URL: process.env.BACKEND_PUBLIC_URL || '',
  RESET_PASSWORD_URL: process.env.RESET_PASSWORD_URL || 'islam-learning-platform://reset-password',
  /** If set, POST /api/sync/* requires header X-ILP-Sync-Secret instead of JWT. */
  ILP_SYNC_SECRET: process.env.ILP_SYNC_SECRET || '',
};
