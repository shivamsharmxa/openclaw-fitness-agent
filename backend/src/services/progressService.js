import { prisma } from '../prisma/client.js';

export const ProgressService = {
  async logMetric(userId, { metricType, value, unit, notes, recordedAt }) {
    return prisma.progressMetric.create({
      data: {
        userId,
        metricType,
        value,
        unit: unit ?? '',
        notes: notes ?? null,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      },
    });
  },

  async getMetrics(userId, { metricType, days = 90 } = {}) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return prisma.progressMetric.findMany({
      where: {
        userId,
        ...(metricType ? { metricType } : {}),
        recordedAt: { gte: since },
      },
      orderBy: { recordedAt: 'asc' },
    });
  },

  async getSummary(userId, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [workoutLogs, metrics] = await Promise.all([
      prisma.workoutLog.findMany({
        where: { userId, completedAt: { gte: since } },
        orderBy: { completedAt: 'asc' },
        select: {
          completedAt: true,
          durationMin: true,
          perceivedRPE: true,
          exercisesData: true,
        },
      }),
      prisma.progressMetric.findMany({
        where: { userId, recordedAt: { gte: since } },
        orderBy: { recordedAt: 'asc' },
      }),
    ]);

    const totalWorkouts = workoutLogs.length;
    const totalMinutes = workoutLogs.reduce((s, l) => s + l.durationMin, 0);
    const rpeEntries = workoutLogs.filter((l) => l.perceivedRPE);
    const avgRPE =
      rpeEntries.length > 0
        ? rpeEntries.reduce((s, l) => s + l.perceivedRPE, 0) / rpeEntries.length
        : 0;

    const weightMetrics = metrics.filter((m) => m.metricType === 'weight_kg');
    const weightChange =
      weightMetrics.length >= 2
        ? weightMetrics.at(-1).value - weightMetrics[0].value
        : null;

    return {
      period: { days, since },
      workouts: {
        total: totalWorkouts,
        totalMinutes,
        avgRPE: Math.round(avgRPE * 10) / 10,
      },
      weight: {
        current: weightMetrics.at(-1)?.value ?? null,
        change: weightChange,
        history: weightMetrics,
      },
      allMetrics: metrics,
      workoutLogs,
    };
  },
};
