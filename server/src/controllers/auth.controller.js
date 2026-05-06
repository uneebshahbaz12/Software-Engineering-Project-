const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const supabase = require('../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN, RESET_PASSWORD_URL, BACKEND_PUBLIC_URL } = require('../config/env');
const { success, error } = require('../utils/apiResponse');
const { sendPasswordResetEmail } = require('../utils/mailer');

const generateToken = (user) => {
  return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, agreedToTerms } = req.body;

    // Check if email exists
    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) return error(res, 'Email already registered', 409);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const { data: user, error: userErr } = await supabase
      .from('users')
      .insert({ name, email, password: hashedPassword, agreed_to_terms: agreedToTerms })
      .select('id, name, email, created_at')
      .single();

    if (userErr) return error(res, userErr.message, 400);

    // Create default profile
    const { data: profile } = await supabase
      .from('profiles')
      .insert({ user_id: user.id, name: user.name, color: '#2DD4BF' })
      .select()
      .single();

    const token = generateToken(user);
    return success(res, { user, token, profile }, 'Account created successfully', 201);
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) return error(res, 'Invalid email or password', 401);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return error(res, 'Invalid email or password', 401);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id);

    const token = generateToken(user);
    const { password: _, ...safeUser } = user;

    return success(res, { user: safeUser, token, profiles }, 'Login successful');
  } catch (err) { next(err); }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    // Always return generic response to prevent email enumeration.
    if (!user?.id) {
      return success(res, null, 'If an account exists with this email, a reset link has been sent');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString(); // 30 minutes

    await supabase
      .from('users')
      .update({
        password_reset_token_hash: tokenHash,
        password_reset_expires_at: expiresAt,
      })
      .eq('id', user.id);

    // Try sending email, but don't fail if SMTP is not configured
    try {
      const connector = RESET_PASSWORD_URL.includes('?') ? '&' : '?';
      const appResetLink = `${RESET_PASSWORD_URL}${connector}token=${encodeURIComponent(rawToken)}`;

      const base = String(BACKEND_PUBLIC_URL || '').replace(/\/+$/, '');
      const bridgeResetLink = base
        ? `${base}/api/auth/reset-password/open?token=${encodeURIComponent(rawToken)}`
        : appResetLink;

      await sendPasswordResetEmail({
        to: user.email,
        resetLink: bridgeResetLink,
        appLink: appResetLink,
        expiresInMinutes: 30,
      });
    } catch (mailErr) {
      console.warn('Email send failed (SMTP may not be configured):', mailErr.message);
      // In development/when SMTP isn't set up, return the token directly
      // so the user can still reset their password
      return success(res, { resetToken: rawToken }, 'SMTP not configured. Use the token below to reset your password.');
    }

    return success(res, null, 'If an account exists with this email, a reset link has been sent');
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
    const nowIso = new Date().toISOString();

    const { data: user } = await supabase
      .from('users')
      .select('id, password_reset_expires_at')
      .eq('password_reset_token_hash', tokenHash)
      .maybeSingle();

    if (!user?.id) return error(res, 'Invalid reset token', 400);
    if (!user.password_reset_expires_at || user.password_reset_expires_at < nowIso) {
      return error(res, 'Reset token expired', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const { error: upErr } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        password_reset_token_hash: null,
        password_reset_expires_at: null,
      })
      .eq('id', user.id);

    if (upErr) return error(res, upErr.message, 400);
    return success(res, null, 'Password reset successful');
  } catch (err) { next(err); }
};

exports.getResetPasswordTokenInfo = async (req, res, next) => {
  try {
    const token = String(req.query.token || '');
    if (!token) return error(res, 'token is required', 400);

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const { data: user } = await supabase
      .from('users')
      .select('id, password_reset_expires_at')
      .eq('password_reset_token_hash', tokenHash)
      .maybeSingle();

    const nowIso = new Date().toISOString();
    const valid = !!user?.id && !!user.password_reset_expires_at && user.password_reset_expires_at >= nowIso;
    return success(res, { valid });
  } catch (err) { next(err); }
};

exports.openResetPasswordBridge = async (req, res) => {
  const token = String(req.query.token || '');
  if (!token) return res.status(400).send('Missing token');

  const appConnector = RESET_PASSWORD_URL.includes('?') ? '&' : '?';
  const appLink = `${RESET_PASSWORD_URL}${appConnector}token=${encodeURIComponent(token)}`;
  const escapedAppLink = appLink.replace(/"/g, '&quot;');
  const escapedToken = token.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return res.status(200).send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Open Reset Password</title>
    <style>
      body { font-family: Arial, sans-serif; max-width: 560px; margin: 40px auto; padding: 0 16px; color: #111827; }
      .btn { display:inline-block; background:#0f766e; color:#fff; text-decoration:none; padding:12px 16px; border-radius:8px; margin-right:8px; }
      .muted { color:#6b7280; font-size: 14px; }
      code { background:#f3f4f6; padding:2px 6px; border-radius:4px; word-break: break-all; }
    </style>
  </head>
  <body>
    <h2>Open Islam Learning Platform</h2>
    <p>We are trying to open your app so you can reset your password.</p>
    <p><a class="btn" href="${escapedAppLink}">Open App</a></p>
    <p class="muted">If app does not open, copy this token and paste it on the reset screen:</p>
    <p><code>${escapedToken}</code></p>
    <script>
      setTimeout(function () {
        window.location.href = "${escapedAppLink}";
      }, 250);
    </script>
  </body>
</html>`);
};

exports.getMe = async (req, res, next) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .eq('id', req.user.userId)
      .single();

    if (!user) return error(res, 'User not found', 404);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id);

    return success(res, { user, profiles });
  } catch (err) { next(err); }
};
