import { getUserByTelegramId } from '../utils/apiClient.js';

/**
 * Middleware that resolves Telegram user ID → app User
 * Attaches user to ctx.state.user
 */
export async function authMiddleware(ctx, next) {
  if (!ctx.from) return next();

  const telegramId = String(ctx.from.id);

  try {
    const user = await getUserByTelegramId(telegramId);
    ctx.state.user = user ?? null;
    ctx.state.telegramId = telegramId;
  } catch (err) {
    ctx.state.user = null;
    ctx.state.telegramId = telegramId;
  }

  return next();
}

/**
 * Require a linked account — sends a message if not registered
 */
export function requireAuth(ctx, next) {
  if (!ctx.state.user) {
    return ctx.reply(
      `You need to link your Telegram account first.\n\n` +
        `1. Register at the FitCoach web app\n` +
        `2. Go to Settings → Link Telegram\n` +
        `3. Come back and try again`
    );
  }
  return next();
}
