import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { UserService } from '../services/userService.js';

export const userValidators = {
  updateProfile: validate([
    body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  ]),
  setGoal: validate([
    body('age').isInt({ min: 10, max: 100 }),
    body('weightKg').isFloat({ min: 20, max: 500 }),
    body('heightCm').isFloat({ min: 50, max: 300 }),
    body('goal').isIn([
      'WEIGHT_LOSS',
      'MUSCLE_GAIN',
      'ENDURANCE',
      'GENERAL_FITNESS',
      'ATHLETIC_PERFORMANCE',
    ]),
    body('experienceLevel').isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
    body('equipment').isArray(),
    body('daysPerWeek').isInt({ min: 1, max: 7 }),
    body('sessionMinutes').optional().isInt({ min: 15, max: 180 }),
    body('dietaryRestrictions').optional().isArray(),
    body('healthConditions').optional().isArray(),
  ]),
};

export const UserController = {
  async getMe(req, res, next) {
    try {
      const user = await UserService.getProfile(req.user.id);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  async updateMe(req, res, next) {
    try {
      const user = await UserService.updateProfile(req.user.id, req.body);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  async setFitnessGoal(req, res, next) {
    try {
      const goal = await UserService.setFitnessGoal(req.user.id, req.body);
      res.json({ success: true, data: goal });
    } catch (err) {
      next(err);
    }
  },

  async getFitnessGoal(req, res, next) {
    try {
      const goal = await UserService.getFitnessGoal(req.user.id);
      res.json({ success: true, data: goal });
    } catch (err) {
      next(err);
    }
  },

  async linkTelegram(req, res, next) {
    try {
      const { telegramId } = req.body;
      if (!telegramId) {
        return res.status(400).json({ success: false, error: { message: 'telegramId required' } });
      }
      await UserService.linkTelegram(req.user.id, telegramId);
      res.json({ success: true, message: 'Telegram account linked successfully' });
    } catch (err) {
      next(err);
    }
  },

  async unlinkTelegram(req, res, next) {
    try {
      await UserService.unlinkTelegram(req.user.id);
      res.json({ success: true, message: 'Telegram account unlinked' });
    } catch (err) {
      next(err);
    }
  },
};
