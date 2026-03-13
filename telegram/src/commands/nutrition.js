import { chatWithAgent } from '../utils/apiClient.js';

export async function nutritionCommand(ctx) {
  const user = ctx.state.user;
  if (!user) return;

  await ctx.sendChatAction('typing');

  try {
    const response = await chatWithAgent(
      user.id,
      'Give me my daily nutrition targets — calories, protein, carbs, and fats — and suggest what to eat today.'
    );

    if (response?.reply) {
      await ctx.reply(response.reply);
    }
  } catch (err) {
    await ctx.reply("Couldn't load nutrition advice. Please try again.");
  }
}
