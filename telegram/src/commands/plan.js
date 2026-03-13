import { chatWithAgent, getCurrentPlan } from '../utils/apiClient.js';
import { formatPlanSummary } from '../utils/format.js';

export async function planCommand(ctx) {
  const user = ctx.state.user;
  if (!user) return;

  await ctx.sendChatAction('typing');

  try {
    const plan = await getCurrentPlan(user.id);

    if (!plan) {
      return ctx.reply(
        `You don't have an active workout plan yet.\n\n` +
          `Say "Generate a workout plan for me" and I'll create one based on your profile!`
      );
    }

    const summary = formatPlanSummary(plan);
    await ctx.reply(summary, { parse_mode: 'Markdown' });

    // Ask agent for today's specific workout
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const response = await chatWithAgent(
      user.id,
      `What is my workout for ${today}? Give me the full exercise list with sets and reps.`
    );

    if (response?.reply) {
      await ctx.reply(response.reply);
    }
  } catch (err) {
    await ctx.reply("Couldn't load your workout plan. Please try again.");
  }
}
