import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../config/constants.js';
import { AppError } from '../utils/app-error.js';

export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }

    const userRoles = req.user.roles || [];
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return next(AppError.forbidden(`Access forbidden. Required role(s): ${allowedRoles.join(', ')}`));
    }

    next();
  };
};
