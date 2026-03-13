import { Router } from 'express';
import { WorkoutController, workoutValidators } from '../controllers/workoutController.js';

export const workoutRouter = Router();

workoutRouter.post('/generate', WorkoutController.generatePlan);
workoutRouter.get('/current', WorkoutController.getCurrentPlan);
workoutRouter.get('/logs', WorkoutController.getWorkoutLogs);
workoutRouter.post('/logs', workoutValidators.log, WorkoutController.logWorkout);
workoutRouter.get('/:planId', WorkoutController.getPlanById);
