import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { ProgressService } from '../services/progressService.js';

export const progressValidators = {
  log: validate([
    body('metricType').notEmpty().isString().isLength({ max: 50 }),
    body('value').isFloat(),
    body('unit').optional().isString().isLength({ max: 20 }),
    body('notes').optional().isString().isLength({ max: 500 }),
  ]),
};

export const ProgressController = {
  async getSummary(req, res, next) {
    try {
      const days = Math.min(Number(req.query.days) || 30, 365);
      const data = await ProgressService.getSummary(req.user.id, days);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getMetrics(req, res, next) {
    try {
      const data = await ProgressService.getMetrics(req.user.id, {
        metricType: req.query.type ?? undefined,
        days: Math.min(Number(req.query.days) || 90, 365),
      });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async logMetric(req, res, next) {
    try {
      const metric = await ProgressService.logMetric(req.user.id, req.body);
      res.status(201).json({ success: true, data: metric });
    } catch (err) {
      next(err);
    }
  },
};
