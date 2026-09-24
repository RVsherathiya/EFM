import { Request, Response, NextFunction } from 'express';
import { tasksService } from './tasks.service.js';
import {
  createTaskSchema,
  updateTaskSchema,
  approveTasksSchema,
  rejectTasksSchema,
  unlockPeriodSchema,
} from './tasks.validation.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/app-error.js';

export class TasksController {
  public async getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.search as string | undefined;
      const projectId = req.query.projectId as string | undefined;
      const userId = req.query.userId as string | undefined;
      const status = req.query.status as string | undefined;
      const category = req.query.category as string | undefined;
      const billable = req.query.billable !== undefined ? req.query.billable === 'true' : undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const result = await tasksService.getTasks(req.user, {
        page,
        limit,
        search,
        projectId,
        userId,
        status,
        category,
        billable,
        startDate,
        endDate,
      });

      sendSuccess(res, result.tasks, 200, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getTimesheetMatrix(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();

      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const targetUserId = req.query.userId as string | undefined;

      if (!startDate || !endDate) {
        throw AppError.badRequest('startDate and endDate query parameters are required.');
      }

      const tasks = await tasksService.getTimesheetMatrix(req.user, startDate, endDate, targetUserId);
      sendSuccess(res, tasks);
    } catch (error) {
      next(error);
    }
  }

  public async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const validatedData = createTaskSchema.parse(req.body);
      const result = await tasksService.createTask(validatedData, req.user);
      sendSuccess(res, result.task, 201, { warning: result.warning });
    } catch (error) {
      next(error);
    }
  }

  public async updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const validatedData = updateTaskSchema.parse(req.body);
      const result = await tasksService.updateTask(req.params.id, validatedData, req.user);
      sendSuccess(res, result.task, 200, { warning: result.warning });
    } catch (error) {
      next(error);
    }
  }

  public async submitTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const taskIds = req.body.taskIds;
      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        throw AppError.badRequest('taskIds array is required.');
      }

      await tasksService.submitTasks(taskIds, req.user);
      sendSuccess(res, { message: 'Tasks submitted for manager approval.' });
    } catch (error) {
      next(error);
    }
  }

  public async getApprovalsQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await tasksService.getTasks(req.user, {
        page,
        limit,
        status: 'SUBMITTED',
        projectId: req.query.projectId as string | undefined,
        userId: req.query.userId as string | undefined,
      });

      sendSuccess(res, result.tasks, 200, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  public async approveTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const validatedData = approveTasksSchema.parse(req.body);
      const result = await tasksService.approveTasks(validatedData.taskIds, validatedData.action, req.user);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async rejectTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const validatedData = rejectTasksSchema.parse(req.body);
      const result = await tasksService.rejectTasks(validatedData.taskIds, validatedData.reason, req.user);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async getPeriodLocks(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const locks = await tasksService.getPeriodLocks();
      sendSuccess(res, locks);
    } catch (error) {
      next(error);
    }
  }

  public async unlockPeriod(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const validatedData = unlockPeriodSchema.parse(req.body);
      await tasksService.unlockPeriod(validatedData.yearMonth, validatedData.reason, req.user);
      sendSuccess(res, { message: `Period ${validatedData.yearMonth} unlocked successfully.` });
    } catch (error) {
      next(error);
    }
  }
}

export const tasksController = new TasksController();
