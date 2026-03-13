import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { createError } from '../utils/AppError.js';
import { prisma } from '../prisma/client.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw createError.unauthorized('No token provided');
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET);
    } catch (e) {
      throw createError.unauthorized(
        e.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw createError.unauthorized('Account not found or deactivated');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function generateTokens(userId) {
  const accessToken = jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
  const refreshToken = jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
  return { accessToken, refreshToken };
}
