export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = {
  badRequest: (msg, code) => new AppError(msg, 400, code ?? 'BAD_REQUEST'),
  unauthorized: (msg) => new AppError(msg ?? 'Unauthorized', 401, 'UNAUTHORIZED'),
  forbidden: (msg) => new AppError(msg ?? 'Forbidden', 403, 'FORBIDDEN'),
  notFound: (msg) => new AppError(msg ?? 'Not found', 404, 'NOT_FOUND'),
  conflict: (msg) => new AppError(msg, 409, 'CONFLICT'),
  tooMany: (msg) => new AppError(msg ?? 'Too many requests', 429, 'RATE_LIMITED'),
};
