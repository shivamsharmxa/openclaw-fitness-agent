import dotenv from 'dotenv';
dotenv.config();

import { Telegraf, session } from 'telegraf';
import { authMiddleware, requireAuth } from './middleware/auth.js';
import { startCommand } from './commands/start.js';
import { planCommand } from './commands/plan.js';
import { progressCommand } from './commands/progress.js';
import { nutritionCommand } from './commands/nutrition.js';
import { helpCommand } from './commands/help.js';
import { messageHandler } from './handlers/message.js';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is not set');
  process.exit(1);
}

const bot = new Telegraf(TOKEN);

// ── Middleware ────────────────────────────────────────────────────
bot.use(session());
bot.use(authMiddleware);

// ── Commands ──────────────────────────────────────────────────────
bot.command('start', startCommand);
bot.command('plan', requireAuth, planCommand);
bot.command('progress', requireAuth, progressCommand);
bot.command('nutrition', requireAuth, nutritionCommand);
bot.command('help', helpCommand);

// ── Message Handler ───────────────────────────────────────────────
bot.on('text', messageHandler);

// ── Error Handler ─────────────────────────────────────────────────
bot.catch((err, ctx) => {
  console.error('Bot error for update', ctx.update?.update_id, err.message);
  ctx.reply('An error occurred. Please try again.').catch(() => {});
});

// ── Launch ────────────────────────────────────────────────────────
const isProd = process.env.NODE_ENV === 'production';

if (isProd && process.env.WEBHOOK_URL) {
  // Webhook mode for production
  bot.launch({
    webhook: {
      domain: process.env.WEBHOOK_URL,
      port: Number(process.env.PORT ?? 8443),
      secretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
    },
  });
  console.log('Bot launched in webhook mode');
} else {
  // Long polling for development
  bot.launch();
  console.log('Bot launched in polling mode');
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
