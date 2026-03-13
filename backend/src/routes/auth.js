import { Router } from 'express';
import { AuthController, authValidators } from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimiter.js';

export const authRouter = Router();

authRouter.post('/register', authLimiter, authValidators.register, AuthController.register);
authRouter.post('/login', authLimiter, authValidators.login, AuthController.login);
authRouter.post('/refresh', AuthController.refresh);
authRouter.post('/logout', AuthController.logout);
