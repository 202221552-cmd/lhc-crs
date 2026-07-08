import { Request, Response, NextFunction } from 'express';
import { AppError, mapPrismaError } from '../errors.js';
import { logger } from '../logger.js';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  // Map Prisma errors to our format
  const appErr = err instanceof AppError ? err : mapPrismaError(err);

  // Log unexpected errors
  if (appErr.statusCode >= 500) {
    logger.error({ err, req: { method: req.method, url: req.url } }, appErr.message);
  } else {
    logger.warn({ err, req: { method: req.method, url: req.url } }, appErr.message);
  }

  // Don't send error details in production for 500s
  const isProduction = process.env.NODE_ENV === 'production';
  const responseBody: Record<string, unknown> = {
    error: {
      code: appErr.code,
      message: appErr.message,
      ...(appErr.details ? { details: appErr.details } : {}),
      ...(!isProduction && appErr.statusCode >= 500 ? { stack: err.stack } : {}),
    },
  };

  res.status(appErr.statusCode).json(responseBody);
}

// 404 handler for unknown routes
export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(`المسار ${req.method} ${req.url} غير موجود`, 404, 'NOT_FOUND'));
}
