import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { WorkoutService } from '../services/workoutService.js';
import { runFitnessAgent } from '../agent/fitnessAgent.js';

export const workoutValidators = {
  log: validate([
    body('durationMin').isInt({ min: 1, max: 600 }),
    body('exercisesData').isArray({ min: 1 }),
    body('perceivedRPE').optional().isInt({ min: 1, max: 10 }),
    body('mood').optional().isString().isLength({ max: 50 }),
    body('caloriesBurned').optional().isInt({ min: 0 }),
  ]),
};

export const WorkoutController = {
  async generatePlan(req, res, next) {
    try {
      const userId = req.user.id;
      const prompt =
        req.body.prompt ??
        'Generate a personalized workout plan based on my fitness profile.';

      const response = await runFitnessAgent({ userId, message: prompt, channel: 'web' });
      res.json({ success: true, data: response });
    } catch (err) {
      next(err);
    }
  },

  async getCurrentPlan(req, res, next) {
    try {
      const plan = await WorkoutService.getCurrentPlan(req.user.id);
      res.json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  },

  async getPlanById(req, res, next) {
    try {
      const plan = await WorkoutService.getPlanById(req.params.planId, req.user.id);
      res.json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  },

  async logWorkout(req, res, next) {
    try {
      const log = await WorkoutService.logWorkout(req.user.id, req.body);
      res.status(201).json({ success: true, data: log });
    } catch (err) {
      next(err);
    }
  },

  async getWorkoutLogs(req, res, next) {
    try {
      const data = await WorkoutService.getWorkoutLogs(req.user.id, {
        limit: Number(req.query.limit) || 20,
        offset: Number(req.query.offset) || 0,
        days: Number(req.query.days) || 30,
      });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
