import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';

export function validate(validations) {
  return async (req, res, next) => {
    for (const validation of validations) {
      await validation.run(req);
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((e) => `${e.path}: ${e.msg}`)
        .join('; ');
      return next(new AppError(messages, 400, 'VALIDATION_ERROR'));
    }
    next();
  };
}
