import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service.js';
import { createUserSchema, updateUserSchema, updateManagerSchema } from './users.validation.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/app-error.js';

export class UsersController {
  public async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.search as string | undefined;
      const departmentId = req.query.departmentId as string | undefined;
      const role = req.query.role as string | undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

      const result = await usersService.getUsers(req.user, {
        page,
        limit,
        search,
        departmentId,
        role,
        sortBy,
        sortOrder,
      });

      sendSuccess(res, result.users, 200, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const user = await usersService.getUserById(req.user, req.params.id);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  public async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const validatedData = createUserSchema.parse(req.body);
      const newUser = await usersService.createUser(validatedData, req.user);
      sendSuccess(res, newUser, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const validatedData = updateUserSchema.parse(req.body);
      const updatedUser = await usersService.updateUser(req.params.id, validatedData, req.user);
      sendSuccess(res, updatedUser);
    } catch (error) {
      next(error);
    }
  }

  public async updateManager(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const validatedData = updateManagerSchema.parse(req.body);
      await usersService.updateManager(req.params.id, validatedData.managerId || null, validatedData.reason, req.user);
      sendSuccess(res, { message: 'Manager updated successfully and hierarchy recalculated.' });
    } catch (error) {
      next(error);
    }
  }

  public async importUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const rows = req.body.rows;
      const commit = Boolean(req.body.commit);

      if (!Array.isArray(rows)) {
        throw AppError.badRequest('Expected rows array in request payload.');
      }

      const result = await usersService.importUsers(rows, commit, req.user);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
