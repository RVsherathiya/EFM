import { Request, Response, NextFunction } from 'express';
import { auditService } from './audit.service.js';
import { sendSuccess } from '../../utils/response.js';

export class AuditController {
  getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { entityType, action, userId, startDate, endDate, page, limit } = req.query;

      const data = await auditService.getAuditLogs({
        entityType: entityType as string,
        action: action as string,
        userId: userId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  };
}

export const auditController = new AuditController();
