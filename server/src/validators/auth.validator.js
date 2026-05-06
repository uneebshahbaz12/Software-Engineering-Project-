const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  agreedToTerms: Joi.boolean().valid(true).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().min(20).required(),
  password: Joi.string().min(6).max(100).required(),
});

module.exports = { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema };
