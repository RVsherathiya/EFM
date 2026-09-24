import { createApp } from './app.js';
import { env } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { logger } from '../config/logger.js';
import { jobScheduler } from '../jobs/scheduler.js';

const startServer = async () => {
  await connectDatabase();

  const app = createApp();

  if (env.NODE_ENV !== 'test') {
    jobScheduler.init();
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 EFM Server listening on port ${env.PORT} in [${env.NODE_ENV}] mode`);
    logger.info(`🌐 Base API URL: http://localhost:${env.PORT}/api/v1`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      logger.info('Server closed. Process terminating.');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forceful shutdown triggered after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch((err) => {
  logger.error('Failed to start EFM server:', err);
  process.exit(1);
});
