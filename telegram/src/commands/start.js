export async function startCommand(ctx) {
  const user = ctx.state.user;
  const firstName = ctx.from?.first_name ?? 'there';

  if (user) {
    return ctx.reply(
      `Welcome back, ${user.name}! 💪\n\n` +
        `What can I help you with today?\n\n` +
        `Commands:\n` +
        `/plan — View your current workout plan\n` +
        `/progress — See your progress summary\n` +
        `/nutrition — Get nutrition advice\n` +
        `/help — Show all commands\n\n` +
        `Or just chat with me normally!`
    );
  }

  return ctx.reply(
    `Hi ${firstName}! I'm FitCoach — your AI personal trainer.\n\n` +
      `To get started:\n` +
      `1. Register at our web app\n` +
      `2. Complete your fitness profile\n` +
      `3. Go to Settings → Link Telegram\n` +
      `4. Come back and say /start again\n\n` +
      `I'll then be able to give you personalized workout plans, nutrition advice, and track your progress!`
  );
}
