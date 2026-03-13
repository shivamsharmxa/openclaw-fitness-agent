import { tool } from 'ai';
import { z } from 'zod';
import { prisma } from '../../prisma/client.js';

export const userProfileTool = tool({
  description: `Read or update the user's fitness profile and personal stats.
Call when: you genuinely need the user's current stats (weight/height/age/goal) and they are NOT already present in the system prompt, OR when the user explicitly provides updated measurements or says their goal has changed.
Do NOT call this just to confirm data already shown in the system prompt. Do NOT call for greetings or casual messages.`,

  parameters: z.object({
    userId: z.string().describe('The user ID'),
    action: z
      .enum(['read', 'update'])
      .describe('"read" to fetch current profile, "update" to save new measurements'),
    updates: z
      .object({
        weightKg: z.number().min(20).max(500).optional(),
        heightCm: z.number().min(50).max(300).optional(),
        age: z.number().min(10).max(100).optional(),
        goal: z.string().optional(),
        daysPerWeek: z.number().min(1).max(7).optional(),
        sessionMinutes: z.number().min(15).max(180).optional(),
        notes: z.string().optional(),
      })
      .optional()
      .describe('Fields to update (only used when action is "update")'),
  }),

  execute: async ({ userId, action, updates }) => {
    if (action === 'read') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, createdAt: true, fitnessGoal: true },
      });
      return user ?? { error: 'User not found' };
    }

    if (action === 'update' && updates && Object.keys(updates).length > 0) {
      const existing = await prisma.fitnessGoal.findUnique({ where: { userId } });
      if (!existing) {
        return { error: 'No fitness profile found. Ask the user to complete onboarding first.' };
      }
      const updated = await prisma.fitnessGoal.update({
        where: { userId },
        data: updates,
      });
      return { success: true, updated: true, profile: updated };
    }

    return { error: 'Invalid action or missing updates object.' };
  },
});
