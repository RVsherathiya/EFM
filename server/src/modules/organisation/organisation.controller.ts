import { Request, Response, NextFunction } from 'express';
import { User } from '../../models/User.model.js';
import { scopeService } from '../../services/scope.service.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/app-error.js';

export class OrganisationController {
  public async getOrgTree(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();

      // Retrieve users visible in scope
      const scopeFilter = await scopeService.buildUserQueryScope(req.user);
      const users = await User.find(scopeFilter)
        .populate('departmentId', 'name code')
        .select('firstName lastName email employeeCode designation level managerId departmentId status roles')
        .lean();

      // Format as tree structure
      const userMap = new Map<string, Record<string, unknown>>();
      users.forEach((u) => {
        userMap.set(u._id.toString(), {
          ...u,
          fullName: `${u.firstName} ${u.lastName}`,
          children: [],
        });
      });

      const tree: Array<Record<string, unknown>> = [];
      users.forEach((u) => {
        const uId = u._id.toString();
        const node = userMap.get(uId)!;
        const managerId = u.managerId?.toString();

        if (managerId && userMap.has(managerId)) {
          const parent = userMap.get(managerId)!;
          (parent.children as Array<Record<string, unknown>>).push(node);
        } else {
          // Root of the visible tree
          tree.push(node);
        }
      });

      sendSuccess(res, tree);
    } catch (error) {
      next(error);
    }
  }

  public async getMyTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();

      const scopeContext = await scopeService.resolve(req.user);
      const directReports = await User.find({
        _id: { $in: scopeContext.directReportIds },
        isDeleted: false,
      })
        .populate('departmentId', 'name code')
        .lean();

      sendSuccess(res, directReports);
    } catch (error) {
      next(error);
    }
  }
}

export const organisationController = new OrganisationController();
