import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { env } from '../config/env.js';
import { errorHandler } from '../middleware/error.middleware.js';
import { apiRateLimiter } from '../middleware/rate-limit.middleware.js';
import routes from '../routes/index.js';
import { AppError } from '../utils/app-error.js';

export const createApp = (): Application => {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Request parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use(compression());

  // HTTP Request Logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
  }

  // Global rate limiter on API
  app.use('/api', apiRateLimiter);

  // API Routes
  app.use('/api/v1', routes);

  // 404 Handler for undefined routes
  app.use('*', (req: Request, _res: Response, next) => {
    next(AppError.notFound(`Cannot find endpoint ${req.method} ${req.originalUrl} on this server`));
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
};
