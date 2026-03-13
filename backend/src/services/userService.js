import { prisma } from '../prisma/client.js';
import { createError } from '../utils/AppError.js';

export const UserService = {
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        telegramId: true,
        telegramLinkedAt: true,
        createdAt: true,
        fitnessGoal: true,
      },
    });
    if (!user) throw createError.notFound('User not found');
    return user;
  },

  async updateProfile(userId, data) {
    return prisma.user.update({
      where: { id: userId },
      data: { name: data.name },
      select: { id: true, email: true, name: true },
    });
  },

  async linkTelegram(userId, telegramId) {
    const existing = await prisma.user.findUnique({
      where: { telegramId: String(telegramId) },
    });
    if (existing && existing.id !== userId) {
      throw createError.conflict(
        'This Telegram account is already linked to another user'
      );
    }
    return prisma.user.update({
      where: { id: userId },
      data: {
        telegramId: String(telegramId),
        telegramLinkedAt: new Date(),
      },
    });
  },

  async unlinkTelegram(userId) {
    return prisma.user.update({
      where: { id: userId },
      data: { telegramId: null, telegramLinkedAt: null },
    });
  },

  async setFitnessGoal(userId, goalData) {
    return prisma.fitnessGoal.upsert({
      where: { userId },
      update: goalData,
      create: { userId, ...goalData },
    });
  },

  async getFitnessGoal(userId) {
    const goal = await prisma.fitnessGoal.findUnique({ where: { userId } });
    if (!goal) {
      throw createError.notFound(
        'No fitness goal found. Please complete onboarding first.'
      );
    }
    return goal;
  },
};
