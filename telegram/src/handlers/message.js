import { chatWithAgent } from '../utils/apiClient.js';
import { trimMessage } from '../utils/format.js';

export async function messageHandler(ctx) {
  const user = ctx.state.user;

  if (!user) {
    return ctx.reply(
      `Please link your account first. Register at the web app and go to Settings → Link Telegram.`
    );
  }

  const text = ctx.message?.text;
  if (!text) return;

  await ctx.sendChatAction('typing');

  try {
    const response = await chatWithAgent(user.id, text);

    if (response?.reply) {
      const reply = trimMessage(response.reply);
      await ctx.reply(reply);
    } else {
      await ctx.reply("I couldn't process that. Please try again.");
    }
  } catch (err) {
    console.error('Message handler error:', err.message);
    await ctx.reply("Something went wrong. Please try again in a moment.");
  }
}
