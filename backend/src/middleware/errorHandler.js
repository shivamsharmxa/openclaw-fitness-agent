import { AppError } from '../utils/AppError.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  logger.error('Request error', {
    message: err.message,
    code: err.code,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, code: err.code },
    });
  }

  // Prisma unique constraint
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: { message: 'A record with this value already exists', code: 'CONFLICT' },
    });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: { message: 'Record not found', code: 'NOT_FOUND' },
    });
  }

  res.status(500).json({
    success: false,
    error: {
      message: env.NODE_ENV === 'development' ? err.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: { message: `Route ${req.method} ${req.url} not found`, code: 'NOT_FOUND' },
  });
}
