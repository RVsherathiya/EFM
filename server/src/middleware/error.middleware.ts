import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { AppError } from '../utils/app-error.js';
import { sendError } from '../utils/response.js';
import { logger } from '../config/logger.js';

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError | ZodError | mongoose.Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  logger.error(`Error processing request: ${req.method} ${req.originalUrl}`, err, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Handle AppError (Known operational domain errors)
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, 422, 'VALIDATION_ERROR', 'Request validation failed', formattedErrors);
    return;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    sendError(res, 400, 'INVALID_IDENTIFIER', `Invalid format for resource ID: ${err.value}`);
    return;
  }

  // Handle Mongoose Duplicate Key Error (11000)
  const mongoError = err as unknown as { code?: number; keyPattern?: Record<string, number> };
  if (mongoError.code === 11000) {
    const keyPattern = mongoError.keyPattern;
    const field = keyPattern ? Object.keys(keyPattern).join(', ') : 'field';
    sendError(res, 409, 'DUPLICATE_ENTRY', `A record with this ${field} already exists.`);
    return;
  }

  // Handle Mongoose ValidationError
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    sendError(res, 422, 'VALIDATION_ERROR', 'Database validation failed', details);
    return;
  }

  // Handle Unhandled/Unexpected Errors (Never expose raw stack traces in production)
  const isDev = process.env.NODE_ENV === 'development';
  sendError(
    res,
    500,
    'INTERNAL_SERVER_ERROR',
    isDev ? err.message : 'An internal server error occurred',
    isDev ? { stack: err.stack } : undefined
  );
};
