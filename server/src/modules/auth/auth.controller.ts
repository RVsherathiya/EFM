import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { loginSchema } from './auth.validation.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/app-error.js';
import { env } from '../../config/env.js';

export class AuthController {
  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await authService.login(
        validatedData.email,
        validatedData.password,
        req.ip,
        req.headers['user-agent']
      );

      // Set httpOnly refresh token cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Also set accessToken cookie for convenience
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      sendSuccess(res, {
        user: result.user,
        accessToken: result.accessToken,
        message: 'Signed in successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  public async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!refreshToken) {
        throw AppError.unauthorized('No refresh token provided.');
      }

      const tokens = await authService.refreshTokens(refreshToken);

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      });

      sendSuccess(res, { accessToken: tokens.accessToken });
    } catch (error) {
      next(error);
    }
  }

  public async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });
      res.clearCookie('accessToken', { httpOnly: true, sameSite: 'strict' });
      sendSuccess(res, { message: 'Logged out successfully.' });
    } catch (error) {
      next(error);
    }
  }

  public async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Not authenticated.');
      }
      sendSuccess(res, req.user);
    } catch (error) {
      next(error);
    }
  }

  public async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const email = req.body.email ? String(req.body.email).trim().toLowerCase() : '';
      if (!email) {
        throw AppError.badRequest('Please enter a valid email.');
      }

      const result = await authService.forgotPassword(email, req.ip, req.headers['user-agent']);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async verifyResetToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.query.token as string || req.body.token as string;
      if (!token) {
        throw AppError.badRequest('Reset token is required.');
      }

      const result = await authService.verifyResetToken(token);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;
      if (!token) {
        throw AppError.badRequest('Reset token is required.');
      }
      if (!newPassword || newPassword.length < 8) {
        throw AppError.badRequest('New password must be at least 8 characters long.');
      }

      const result = await authService.resetPassword(token, newPassword, req.ip, req.headers['user-agent']);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async resetPasswordWithOld(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, oldPassword, newPassword, token } = req.body;
      if (!email) {
        throw AppError.badRequest('Email is required.');
      }
      if (!oldPassword) {
        throw AppError.badRequest('Old password is required.');
      }
      if (!newPassword || newPassword.length < 8) {
        throw AppError.badRequest('New password must be at least 8 characters long.');
      }

      const result = await authService.resetPasswordWithOld(
        String(email).trim().toLowerCase(),
        String(oldPassword),
        String(newPassword),
        token ? String(token) : undefined,
        req.ip,
        req.headers['user-agent']
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
