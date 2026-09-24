import { Request, Response, NextFunction } from 'express';
import { exportsService } from './exports.service.js';
import { scopeService } from '../../services/scope.service.js';

export class ExportsController {
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

  exportTimesheet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scopeParams = await this.getScopeParams(req);
      const csv = await exportsService.exportTimesheetCsv(scopeParams);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="timesheet-export-${Date.now()}.csv"`);
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  };

  exportProjectEffort = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scopeParams = await this.getScopeParams(req);
      const csv = await exportsService.exportProjectEffortCsv(scopeParams);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="project-effort-export-${Date.now()}.csv"`);
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  };

  exportUtilisation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scopeParams = await this.getScopeParams(req);
      const csv = await exportsService.exportUtilisationCsv(scopeParams);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="utilisation-export-${Date.now()}.csv"`);
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  };
}

export const exportsController = new ExportsController();
