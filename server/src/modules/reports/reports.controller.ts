import { Request, Response, NextFunction } from 'express';
import { reportsService } from './reports.service.js';
import { scopeService } from '../../services/scope.service.js';
import { sendSuccess } from '../../utils/response.js';

export class ReportsController {
  private async getScopeParams(req: Request) {
    const user = req.user!;
    const scopeContext = await scopeService.resolve(user);
    const isGlobalScope = scopeContext.isHRAdmin || scopeContext.isSuperAdmin;
    const allowedUserIds = isGlobalScope ? undefined : [scopeContext.userId, ...scopeContext.allSubordinateIds];

    return {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      projectId: req.query.projectId as string,
      employeeId: req.query.employeeId as string,
      category: req.query.category as string,
      billable: req.query.billable !== undefined ? req.query.billable === 'true' : undefined,
      status: req.query.status as string,
      allowedUserIds,
      isGlobalScope,
    };
  }

  getTimesheetReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scopeParams = await this.getScopeParams(req);
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 25;

      const data = await reportsService.getTimesheetReport({ ...scopeParams, page, limit });
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  };

  getProjectEffortReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scopeParams = await this.getScopeParams(req);
      const data = await reportsService.getProjectEffortReport(scopeParams);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  };

  getUtilisationReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scopeParams = await this.getScopeParams(req);
      const workingDays = req.query.workingDays ? Number(req.query.workingDays) : 22;
      const data = await reportsService.getUtilisationReport({ ...scopeParams, workingDays });
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  };

  getCategoryBreakdown = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scopeParams = await this.getScopeParams(req);
      const data = await reportsService.getCategoryBreakdown(scopeParams);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  };

  getBillableSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scopeParams = await this.getScopeParams(req);
      const data = await reportsService.getBillableSummary(scopeParams);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  };
}

export const reportsController = new ReportsController();
