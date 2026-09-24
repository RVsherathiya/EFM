import { Request, Response, NextFunction } from 'express';
import { departmentsService } from './departments.service.js';
import { createDepartmentSchema, updateDepartmentSchema } from './departments.validation.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/app-error.js';

export class DepartmentsController {
  public async getDepartments(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const depts = await departmentsService.getDepartments();
      sendSuccess(res, depts);
    } catch (error) {
      next(error);
    }
  }

  public async getDepartmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dept = await departmentsService.getDepartmentById(req.params.id);
      sendSuccess(res, dept);
    } catch (error) {
      next(error);
    }
  }

  public async createDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const validatedData = createDepartmentSchema.parse(req.body);
      const newDept = await departmentsService.createDepartment(validatedData, req.user);
      sendSuccess(res, newDept, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const validatedData = updateDepartmentSchema.parse(req.body);
      const updatedDept = await departmentsService.updateDepartment(req.params.id, validatedData, req.user);
      sendSuccess(res, updatedDept);
    } catch (error) {
      next(error);
    }
  }
}

export const departmentsController = new DepartmentsController();
