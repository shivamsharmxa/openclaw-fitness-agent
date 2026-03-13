import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma/client.js';
import { generateTokens } from '../middleware/auth.js';
import { createError } from '../utils/AppError.js';
import { env } from '../config/env.js';

const BCRYPT_ROUNDS = 12;
const REFRESH_EXPIRES_DAYS = 7;

export const AuthService = {
  async register({ email, password, name }) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw createError.conflict('Email already registered');

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
      select: { id: true, email: true, name: true, telegramId: true, createdAt: true },
    });

    const tokens = generateTokens(user.id);
    await storeRefreshToken(user.id, tokens.refreshToken);

    return { user, ...tokens };
  },

  async login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw createError.unauthorized('Invalid email or password');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw createError.unauthorized('Invalid email or password');

    if (!user.isActive) throw createError.forbidden('Account is deactivated');

    const tokens = generateTokens(user.id);
    await storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: { id: user.id, email: user.email, name: user.name, telegramId: user.telegramId ?? null },
      ...tokens,
    };
  },

  async refresh(refreshToken) {
    let payload;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      throw createError.unauthorized('Invalid refresh token');
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw createError.unauthorized('Refresh token expired or revoked');
    }

    await prisma.refreshToken.delete({ where: { id: stored.id } });
    const tokens = generateTokens(payload.sub);
    await storeRefreshToken(payload.sub, tokens.refreshToken);

    return tokens;
  },

  async logout(refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  },
};

async function storeRefreshToken(userId, token) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS);
  await prisma.refreshToken.create({ data: { userId, token, expiresAt } });
}
