/**
 * Escape special characters for Telegram MarkdownV2
 */
export function escapeMarkdown(text) {
  if (!text) return '';
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

/**
 * Convert plain markdown to Telegram-safe MarkdownV2
 */
export function toTelegramMd(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '*$1*')      // bold
    .replace(/^#{1,3} (.*)/gm, '*$1*')      // headings → bold
    .replace(/`(.*?)`/g, '`$1`')            // inline code (keep)
    .replace(/[_[\]()~>#+\-=|{}.!\\]/g, (char) => {
      // Don't re-escape already-escaped chars or code spans
      return `\\${char}`;
    });
}

/**
 * Trim message to Telegram's 4096 char limit
 */
export function trimMessage(text, limit = 4096) {
  if (text.length <= limit) return text;
  return text.slice(0, limit - 100) + '\n\n_[message trimmed]_';
}

/**
 * Format a workout plan summary for Telegram
 */
export function formatPlanSummary(plan) {
  if (!plan) return 'No active workout plan found.';

  const schedule = plan.planData?.weeklySchedule ?? {};
  const lines = [`*${plan.name}*\n`];

  for (const [day, session] of Object.entries(schedule)) {
    if (session.type === 'rest') {
      lines.push(`${day}: Rest`);
    } else {
      const count = session.exercises?.length ?? 0;
      lines.push(`${day}: ${session.focus} (${count} exercises)`);
    }
  }

  lines.push(`\nUse /plan for today's full workout details`);
  return lines.join('\n');
}

/**
 * Format progress summary for Telegram
 */
export function formatProgressSummary(summary) {
  const { workouts, weight, adherence } = summary;
  const lines = [
    `*Progress Summary — Last ${summary.period.days} days*\n`,
    `Workouts completed: ${workouts.total}`,
    `Total time: ${workouts.totalMinutes} min`,
    `Consistency: ${adherence?.percentage ?? '—'}% (${adherence?.rating ?? '—'})`,
  ];

  if (weight.current) {
    lines.push(`\nCurrent weight: ${weight.current}kg`);
    if (weight.change !== null) {
      const sign = weight.change > 0 ? '+' : '';
      lines.push(`Change: ${sign}${weight.change.toFixed(1)}kg`);
    }
  }

  return lines.join('\n');
}
