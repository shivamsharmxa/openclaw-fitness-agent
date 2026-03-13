import { Router } from 'express';
import { UserController, userValidators } from '../controllers/userController.js';

export const userRouter = Router();

userRouter.get('/me', UserController.getMe);
userRouter.patch('/me', userValidators.updateProfile, UserController.updateMe);
userRouter.post('/me/fitness-goal', userValidators.setGoal, UserController.setFitnessGoal);
userRouter.get('/me/fitness-goal', UserController.getFitnessGoal);
userRouter.post('/me/link-telegram', UserController.linkTelegram);
userRouter.delete('/me/link-telegram', UserController.unlinkTelegram);
