import { Types, FilterQuery } from 'mongoose';
import { IUser } from '../models/User.model.js';
import { USER_ROLES } from '../config/constants.js';
import { hierarchyService } from '../domain/hierarchy/hierarchy.service.js';
import { AppError } from '../utils/app-error.js';

export interface ScopeContext {
  userId: Types.ObjectId;
  roles: string[];
  departmentId?: Types.ObjectId;
  isSuperAdmin: boolean;
  isHRAdmin: boolean;
  isSenior: boolean;
  isPM: boolean;
  isEmployee: boolean;
  directReportIds: Types.ObjectId[];
  allSubordinateIds: Types.ObjectId[];
}

export class ScopeService {
  /**
   * Resolves the full ScopeContext for a logged-in user.
   */
  public async resolve(user: IUser): Promise<ScopeContext> {
    const roles = user.roles || [];
    const isSuperAdmin = roles.includes(USER_ROLES.SUPER_ADMIN);
    const isHRAdmin = roles.includes(USER_ROLES.HR_ADMIN) || isSuperAdmin;
    const isSenior = roles.includes(USER_ROLES.SENIOR);
    const isPM = roles.includes(USER_ROLES.PM);
    const isEmployee = true; // All authenticated users have baseline employee scope

    let directReportIds: Types.ObjectId[] = [];
    let allSubordinateIds: Types.ObjectId[] = [];

    if (isSenior || isHRAdmin || isSuperAdmin) {
      directReportIds = await hierarchyService.getDescendantUserIds(user._id, true);
      allSubordinateIds = await hierarchyService.getDescendantUserIds(user._id, false);
    }

    return {
      userId: user._id,
      roles,
      departmentId: user.departmentId,
      isSuperAdmin,
      isHRAdmin,
      isSenior,
      isPM,
      isEmployee,
      directReportIds,
      allSubordinateIds,
    };
  }

  /**
   * Builds MongoDB query filter for accessing Users/Employees according to user scope.
   * BR-SCOPE-001 through BR-SCOPE-006
   */
  public async buildUserQueryScope(user: IUser): Promise<FilterQuery<IUser>> {
    const context = await this.resolve(user);

    // HR, Super Admin, and PMs (for project team assembly) can view all non-deleted employees
    if (context.isHRAdmin || context.isSuperAdmin || context.isPM) {
      return { isDeleted: false };
    }

    // Senior can view self and their entire subordinate tree
    if (context.isSenior) {
      const allowedIds = [context.userId, ...context.allSubordinateIds];
      return {
        _id: { $in: allowedIds },
        isDeleted: false,
      };
    }

    // Default Employee: only own record
    return {
      _id: context.userId,
      isDeleted: false,
    };
  }

  /**
   * Verify if a user can view another employee's details.
   */
  public async canViewEmployee(user: IUser, targetEmployeeId: string | Types.ObjectId): Promise<boolean> {
    const targetId = new Types.ObjectId(targetEmployeeId.toString());

    // Self
    if (user._id.equals(targetId)) {
      return true;
    }

    const context = await this.resolve(user);

    // HR / Super Admin
    if (context.isHRAdmin || context.isSuperAdmin) {
      return true;
    }

    // Senior: Check if targetId is in subordinate tree
    if (context.isSenior) {
      const isSubordinate = context.allSubordinateIds.some((id) => id.equals(targetId));
      if (isSubordinate) return true;
    }

    return false;
  }

  /**
   * Enforces that current user can view target employee, throwing 403 otherwise.
   */
  public async enforceCanViewEmployee(user: IUser, targetEmployeeId: string | Types.ObjectId): Promise<void> {
    const allowed = await this.canViewEmployee(user, targetEmployeeId);
    if (!allowed) {
      throw AppError.forbidden('Access denied (BR-SCOPE-006). You do not have permission to view this employee.');
    }
  }
}

export const scopeService = new ScopeService();
