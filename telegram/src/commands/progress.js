import { chatWithAgent, getProgress } from '../utils/apiClient.js';
import { formatProgressSummary } from '../utils/format.js';

export async function progressCommand(ctx) {
  const user = ctx.state.user;
  if (!user) return;

  await ctx.sendChatAction('typing');

  try {
    const summary = await getProgress(user.id);
    const formatted = formatProgressSummary(summary);
    await ctx.reply(formatted, { parse_mode: 'Markdown' });

    // Get AI-generated recommendations
    const response = await chatWithAgent(
      user.id,
      'Based on my recent workout history and progress, what adjustments do you recommend?'
    );

    if (response?.reply) {
      await ctx.reply(response.reply);
    }
  } catch (err) {
    await ctx.reply("Couldn't load your progress. Make sure you've logged some workouts first!");
  }
}
