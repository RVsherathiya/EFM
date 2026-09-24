import cron from 'node-cron';
import { logger } from '../config/logger.js';
import { PeriodLock } from '../models/PeriodLock.model.js';
import { Cycle } from '../models/Cycle.model.js';
import { notificationsService } from '../modules/notifications/notifications.service.js';
import { User } from '../models/User.model.js';

export class JobScheduler {
  private static instance: JobScheduler;
  private isInitialized = false;

  public static getInstance(): JobScheduler {
    if (!JobScheduler.instance) {
      JobScheduler.instance = new JobScheduler();
    }
    return JobScheduler.instance;
  }

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    logger.info('Initializing automated background jobs scheduler...');

    // 1. Daily Task Logging Reminder at 18:00 Mon-Fri
    cron.schedule('0 18 * * 1-5', async () => {
      logger.info('[Job] Running daily task logging reminder job...');
      try {
        const activeUsers = await User.find({ status: 'ACTIVE' }).select('_id firstName').lean();
        for (const u of activeUsers) {
          await notificationsService.createNotification({
            recipientId: u._id,
            type: 'TASK_REMINDER',
            title: 'Daily Timesheet Reminder',
            message: 'Remember to submit your logged tasks and hours for today.',
            linkUrl: '/tasks',
          });
        }
      } catch (err) {
        logger.error('[Job] Daily task reminder job failed', err);
      }
    });

    // 2. Period Lock Check at 00:01 on the 5th of every month
    cron.schedule('1 0 5 * *', async () => {
      logger.info('[Job] Running monthly period lock job...');
      try {
        const now = new Date();
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const yearMonth = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

        const existing = await PeriodLock.findOne({ yearMonth });
        if (!existing) {
          await PeriodLock.create({
            yearMonth,
            isLocked: true,
            lockedAt: new Date(),
          });
          logger.info(`[Job] Monthly period lock applied for ${yearMonth}`);
        }
      } catch (err) {
        logger.error('[Job] Monthly period lock job failed', err);
      }
    });

    // 3. Cycle stage transition monitor every hour
    cron.schedule('0 * * * *', async () => {
      try {
        const now = new Date();
        const activeCycles = await Cycle.find({
          status: 'ACTIVE',
          'timeline.selfDeadline': { $lte: now },
        });

        for (const cycle of activeCycles) {
          logger.info(`[Job] Active cycle ${cycle.code} self review stage reached deadline.`);
        }
      } catch (err) {
        logger.error('[Job] Cycle stage monitor job failed', err);
      }
    });

    logger.info('Background scheduler initialized successfully.');
  }
}

export const jobScheduler = JobScheduler.getInstance();
