import { prisma } from '../prisma/client.js';
import { createError } from '../utils/AppError.js';

export const WorkoutService = {
  async getCurrentPlan(userId) {
    return prisma.workoutPlan.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getPlanById(planId, userId) {
    const plan = await prisma.workoutPlan.findFirst({
      where: { id: planId, userId },
    });
    if (!plan) throw createError.notFound('Workout plan not found');
    return plan;
  },

  async savePlan(userId, { name, description, planData }) {
    // Deactivate all existing plans
    await prisma.workoutPlan.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    return prisma.workoutPlan.create({
      data: {
        userId,
        name,
        description: description ?? null,
        planData,
        isActive: true,
        aiGenerated: true,
      },
    });
  },

  async logWorkout(userId, logData) {
    return prisma.workoutLog.create({
      data: {
        userId,
        planId: logData.planId ?? null,
        durationMin: logData.durationMin,
        exercisesData: logData.exercisesData,
        notes: logData.notes ?? null,
        perceivedRPE: logData.perceivedRPE ?? null,
        mood: logData.mood ?? null,
        caloriesBurned: logData.caloriesBurned ?? null,
        completedAt: logData.completedAt
          ? new Date(logData.completedAt)
          : new Date(),
      },
    });
  },

  async getWorkoutLogs(userId, { limit = 20, offset = 0, days = 30 } = {}) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [logs, total] = await Promise.all([
      prisma.workoutLog.findMany({
        where: { userId, completedAt: { gte: since } },
        orderBy: { completedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.workoutLog.count({
        where: { userId, completedAt: { gte: since } },
      }),
    ]);

    return { logs, total, hasMore: offset + limit < total };
  },
};
