import { Router } from 'express';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { runFitnessAgent } from '../agent/fitnessAgent.js';
import { prisma } from '../prisma/client.js';

export const telegramRouter = Router();

telegramRouter.post('/webhook', verifySignature, async (req, res) => {
  // Always respond 200 immediately to Telegram
  res.sendStatus(200);

  try {
    const { message } = req.body;
    if (!message?.text) return;

    const telegramId = String(message.from.id);
    const text = message.text.trim();

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      logger.debug('Telegram message from unlinked user', { telegramId });
      return;
    }

    await runFitnessAgent({ userId: user.id, message: text, channel: 'telegram' });
  } catch (err) {
    logger.error('Telegram webhook processing error', { error: err.message });
  }
});

function verifySignature(req, res, next) {
  if (!env.TELEGRAM_WEBHOOK_SECRET) return next();
  const header = req.headers['x-telegram-bot-api-secret-token'];
  if (header !== env.TELEGRAM_WEBHOOK_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}
