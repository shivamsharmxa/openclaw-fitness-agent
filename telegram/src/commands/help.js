export async function helpCommand(ctx) {
  await ctx.reply(
    `FitCoach Commands:\n\n` +
      `/start — Welcome message\n` +
      `/plan — View your current workout plan & today's session\n` +
      `/progress — Weekly progress summary\n` +
      `/nutrition — Daily nutrition targets & meal ideas\n` +
      `/help — Show this message\n\n` +
      `You can also just chat with me! Try:\n` +
      `• "Generate a new workout plan for me"\n` +
      `• "How much protein should I eat?"\n` +
      `• "I just finished my workout"\n` +
      `• "I want to build muscle"\n` +
      `• "What should I eat before training?"`
  );
}
