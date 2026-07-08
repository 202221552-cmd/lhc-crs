import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger[level]({
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.getHeader('content-length'),
    }, `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
}
