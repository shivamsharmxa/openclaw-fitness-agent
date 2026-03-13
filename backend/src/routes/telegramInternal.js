/**
 * Internal API routes called by the Telegram bot service.
 * These are NOT exposed publicly — secured by internal API key.
 */
import { Router } from 'express';
import { timingSafeEqual } from 'crypto';
import { prisma } from '../prisma/client.js';
import { runFitnessAgent } from '../agent/fitnessAgent.js';
import { ProgressService } from '../services/progressService.js';
import { WorkoutService } from '../services/workoutService.js';
import { env } from '../config/env.js';

export const telegramInternalRouter = Router();

// Verify internal API key — constant-time comparison prevents timing attacks
function verifyInternalKey(req, res, next) {
  const key = req.headers['x-internal-key'] ?? '';
  const expected = env.INTERNAL_API_KEY;
  const valid =
    key.length === expected.length &&
    timingSafeEqual(Buffer.from(key), Buffer.from(expected));
  if (!valid) return res.status(403).json({ error: 'Forbidden' });
  next();
}

telegramInternalRouter.use(verifyInternalKey);

// Get user by Telegram ID
telegramInternalRouter.get('/user/:telegramId', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: req.params.telegramId },
      select: { id: true, name: true, telegramId: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// Chat with AI agent
telegramInternalRouter.post('/chat', async (req, res, next) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message required' });
    }
    const response = await runFitnessAgent({ userId, message, channel: 'telegram' });
    res.json({ reply: response.content, toolsUsed: response.toolsUsed });
  } catch (err) {
    next(err);
  }
});

// Get progress summary
telegramInternalRouter.get('/progress/:userId', async (req, res, next) => {
  try {
    const summary = await ProgressService.getSummary(req.params.userId, 30);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

// Get current workout plan
telegramInternalRouter.get('/plan/:userId', async (req, res, next) => {
  try {
    const plan = await WorkoutService.getCurrentPlan(req.params.userId);
    res.json(plan);
  } catch (err) {
    next(err);
  }
});
