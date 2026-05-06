const nodemailer = require('nodemailer');
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
} = require('../config/env');

let transporter = null;

function canSendEmail() {
  return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && SMTP_FROM);
}

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

async function sendPasswordResetEmail({ to, resetLink, appLink, expiresInMinutes = 30 }) {
  if (!canSendEmail()) {
    throw new Error('SMTP is not configured. Set SMTP_* variables in server/.env');
  }
  const subject = 'Reset your Islam Learning Platform password';
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 8px;">Password reset request</h2>
      <p>Assalamu Alaikum,</p>
      <p>We received a request to reset your password. Use the button below to continue:</p>
      <p style="margin: 20px 0;">
        <a href="${resetLink}" style="background:#0f766e;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px;">Reset Password</a>
      </p>
      ${appLink ? `<p>If the button above does not open in your app, use this app link directly:<br/><a href="${appLink}">${appLink}</a></p>` : ''}
      <p>This link expires in ${expiresInMinutes} minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  `;

  const text = [
    'Assalamu Alaikum,',
    '',
    'We received a request to reset your password.',
    `Reset link: ${resetLink}`,
    ...(appLink ? [`App link: ${appLink}`] : []),
    `This link expires in ${expiresInMinutes} minutes.`,
    'If you did not request this, please ignore this email.',
  ].join('\n');

  return getTransporter().sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
}

module.exports = { sendPasswordResetEmail, canSendEmail };
