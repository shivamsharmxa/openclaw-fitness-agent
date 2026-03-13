import { Router } from 'express';
import { ProgressController, progressValidators } from '../controllers/progressController.js';

export const progressRouter = Router();

progressRouter.get('/', ProgressController.getSummary);
progressRouter.get('/metrics', ProgressController.getMetrics);
progressRouter.post('/metrics', progressValidators.log, ProgressController.logMetric);
