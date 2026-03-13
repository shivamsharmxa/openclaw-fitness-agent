import { tool } from 'ai';
import { z } from 'zod';
import { ProgressService } from '../../services/progressService.js';
import { prisma } from '../../prisma/client.js';
import { logger } from '../../config/logger.js';

export const progressAnalyzerTool = tool({
  description: `Retrieve and analyze the user's workout history, body metrics, and performance trends.
Call when: user asks about their progress, wants a weekly/monthly summary, requests plan adjustments based on results, or asks how they are doing.
Do NOT call for casual messages, greetings, or non-progress questions.`,

  parameters: z.object({
    userId: z.string().describe('The user ID'),
    timeframeDays: z
      .number()
      .min(1)
      .max(365)
      .default(30)
      .describe('Number of days to analyse (7, 30, or 90 are typical)'),
    analysisType: z
      .enum(['full_summary', 'weight_only', 'workouts_only', 'recommendations'])
      .default('full_summary')
      .describe('Scope of analysis to return'),
  }),

  execute: async ({ userId, timeframeDays = 30, analysisType = 'full_summary' }) => {
    logger.debug('progress_analyzer called', { userId, timeframeDays });

    const [summary, fitnessGoal] = await Promise.all([
      ProgressService.getSummary(userId, timeframeDays),
      prisma.fitnessGoal.findUnique({ where: { userId }, select: { daysPerWeek: true } }),
    ]);

    const targetDaysPerWeek = fitnessGoal?.daysPerWeek ?? 3;
    const adherence = calcAdherence(summary, targetDaysPerWeek);
    const weightTrend = analyzeWeight(summary.weight);
    const recommendations = buildRecommendations(summary, adherence);

    return {
      period: `Last ${timeframeDays} days`,
      adherence,
      weightTrend,
      recommendations,
      ...(analysisType === 'full_summary' && {
        rawSummary: {
          totalWorkouts: summary.workouts.total,
          totalMinutes: summary.workouts.totalMinutes,
          avgRPE: summary.workouts.avgRPE,
          metricsLogged: summary.allMetrics.length,
        },
      }),
    };
  },
});

// ── Analysis helpers ──────────────────────────────────────────────────────────

function calcAdherence(summary, targetDaysPerWeek = 3) {
  const weeks = summary.period.days / 7;
  const pct = Math.min(100, Math.round((summary.workouts.total / (weeks * targetDaysPerWeek)) * 100));
  return {
    workoutsCompleted: summary.workouts.total,
    totalMinutes: summary.workouts.totalMinutes,
    percentage: pct,
    rating: pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good' : pct >= 40 ? 'Fair' : 'Needs Improvement',
  };
}

function analyzeWeight(weight) {
  if (!weight.current) return { status: 'No weight data logged yet', change: null };
  if (!weight.change) return { status: `Current weight: ${weight.current}kg. Log more entries to track trend.`, change: null };
  const dir = weight.change > 0 ? 'gained' : 'lost';
  return {
    current: weight.current,
    change: weight.change,
    status: `${dir} ${Math.abs(weight.change).toFixed(1)}kg over this period`,
    direction: dir,
  };
}

function buildRecommendations(summary, adherence) {
  const recs = [];

  if (summary.workouts.total === 0) {
    recs.push('No workouts logged yet. Start with even a 20-minute session to build momentum!');
    return recs;
  }
  if (adherence.percentage < 40)
    recs.push('Workout frequency is low. Try scheduling sessions in your calendar like fixed appointments.');
  if (summary.workouts.avgRPE > 8.5)
    recs.push('Perceived effort is consistently high. Plan a deload week: reduce volume by 40–50%.');
  if (summary.workouts.avgRPE < 4 && summary.workouts.total > 3)
    recs.push('Workouts feel very easy. Increase load or add sets to keep progressing.');
  if (summary.weight.history?.length < 3)
    recs.push('Log weight 2–3 times per week (same time, same conditions) for accurate trends.');
  if (adherence.percentage >= 80)
    recs.push("Consistency is excellent — you're building a real habit. Consider progressing your plan.");
  if (recs.length === 0)
    recs.push("You're making steady progress. Keep logging workouts and weight to see detailed trends.");

  return recs;
}
