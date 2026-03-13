import { body } from 'express-validator';
import { AuthService } from '../services/authService.js';
import { validate } from '../middleware/validate.js';

export const authValidators = {
  register: validate([
    body('email').isEmail().normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('name').trim().notEmpty().isLength({ max: 100 }),
  ]),
  login: validate([
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ]),
};

export const AuthController = {
  async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ success: false, error: { message: 'refreshToken required' } });
      }
      const tokens = await AuthService.refresh(refreshToken);
      res.json({ success: true, data: tokens });
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) await AuthService.logout(refreshToken);
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  },
};
