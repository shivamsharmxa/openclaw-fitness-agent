import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { createError } from '../utils/AppError.js';

export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) =>
    next(createError.tooMany('Too many requests, please slow down')),
});

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.CHAT_RATE_LIMIT_MAX,
  keyGenerator: (req) => req.user?.id ?? req.ip,
  handler: (req, res, next) =>
    next(createError.tooMany('Chat rate limit reached. Wait a moment.')),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  handler: (req, res, next) =>
    next(createError.tooMany('Too many auth attempts')),
});
