import { Router } from 'express';
import { ChatController, chatValidators } from '../controllers/chatController.js';
import { chatLimiter } from '../middleware/rateLimiter.js';

export const chatRouter = Router();

chatRouter.post('/', chatLimiter, chatValidators.send, ChatController.send);
chatRouter.get('/history', ChatController.getHistory);
chatRouter.delete('/history', ChatController.clearHistory);
