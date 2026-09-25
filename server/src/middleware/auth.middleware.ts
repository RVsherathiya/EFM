import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token.util.js';
import { User, IUser } from '../models/User.model.js';
import { AppError } from '../utils/app-error.js';

// Extend Express Request type to carry the authenticated user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Check Bearer authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      // 2. Check accessToken cookie
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw AppError.unauthorized('Authentication required. No token provided.');
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw AppError.unauthorized('Invalid or expired authentication token.');
    }

    const user = await User.findOne({ _id: payload.userId, isDeleted: false })
      .populate('departmentId', 'name code')
      .populate('managerId', 'firstName lastName email employeeCode designation');
    if (!user) {
      throw AppError.unauthorized('The user belonging to this token no longer exists.');
    }

    if (user.status !== 'ACTIVE') {
      throw AppError.forbidden('Your account is deactivated. Please contact HR.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
