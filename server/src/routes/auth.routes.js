const router = require('express').Router();
const { register, login, forgotPassword, resetPassword, getResetPasswordTokenInfo, openResetPasswordBridge, getMe } = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validators/auth.validator');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);
router.get('/reset-password/validate-token', authLimiter, getResetPasswordTokenInfo);
router.get('/reset-password/open', openResetPasswordBridge);
router.get('/me', auth, getMe);

module.exports = router;
