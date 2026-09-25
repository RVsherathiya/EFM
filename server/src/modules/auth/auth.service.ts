import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { authRepository } from './auth.repository.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/token.util.js';
import { AppError } from '../../utils/app-error.js';
import { auditService } from '../../services/audit.service.js';
import { emailService } from '../../services/email.service.js';
import { env } from '../../config/env.js';
import { IUser } from '../../models/User.model.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: IUser;
}

export class AuthService {
  public async login(email: string, passwordPlain: string, ip?: string, userAgent?: string): Promise<AuthTokens> {
    const user = await authRepository.findByEmailWithPassword(email);
    if (!user) {
      throw AppError.unauthorized('Invalid email or password.');
    }

    if (user.status !== 'ACTIVE') {
      throw AppError.forbidden('Your account is deactivated. Please contact HR.');
    }

    if (!user.passwordHash) {
      throw AppError.unauthorized('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid email or password.');
    }

    const accessToken = generateAccessToken({
      userId: user._id,
      email: user.email,
      roles: user.roles,
    });

    const refreshToken = generateRefreshToken({ userId: user._id });

    // Log successful login
    await auditService.log({
      entity: 'USER',
      entityId: user._id.toString(),
      action: 'LOGIN',
      userId: user._id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      ip,
      userAgent,
    });

    return { accessToken, refreshToken, user };
  }

  public async refreshTokens(currentRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    let payload;
    try {
      payload = verifyRefreshToken(currentRefreshToken);
    } catch {
      throw AppError.unauthorized('Invalid or expired refresh token. Please sign in again.');
    }

    const user = await authRepository.findById(payload.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw AppError.unauthorized('User session is no longer active.');
    }

    const newAccessToken = generateAccessToken({
      userId: user._id,
      email: user.email,
      roles: user.roles,
    });

    const newRefreshToken = generateRefreshToken({ userId: user._id });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  public async forgotPassword(email: string, ip?: string, userAgent?: string): Promise<{ message: string; devResetUrl?: string; token?: string; email?: string }> {
    const user = await authRepository.findByEmail(email);

    // If user does not exist or is inactive, return proper error
    if (!user || user.status !== 'ACTIVE') {
      throw AppError.notFound('No account found with this email address.');
    }

    // Generate secure random unhashed reset token
    const unhashedToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(unhashedToken).digest('hex');
    const tokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes validity

    await authRepository.saveResetToken(user._id.toString(), hashedToken, tokenExpires);

    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${unhashedToken}`;

    await emailService.sendPasswordResetEmail(
      user.email,
      `${user.firstName} ${user.lastName}`,
      resetUrl,
      unhashedToken
    );

    await auditService.log({
      entity: 'USER',
      entityId: user._id.toString(),
      action: 'PASSWORD_RESET_REQUESTED',
      userId: user._id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      ip,
      userAgent,
    });

    return {
      message: 'Password reset instructions dispatched successfully.',
      devResetUrl: env.NODE_ENV !== 'production' ? resetUrl : undefined,
      token: unhashedToken,
      email: user.email,
    };
  }

  public async resetPasswordWithOld(
    email: string,
    oldPasswordPlain: string,
    newPasswordPlain: string,
    _token?: string,
    ip?: string,
    userAgent?: string
  ): Promise<{ message: string }> {
    if (!email) {
      throw AppError.badRequest('Email is required.');
    }
    if (!oldPasswordPlain) {
      throw AppError.badRequest('Old password is required.');
    }
    if (!newPasswordPlain || newPasswordPlain.length < 8) {
      throw AppError.badRequest('New password must be at least 8 characters long.');
    }

    const user = await authRepository.findByEmailWithPassword(email);
    if (!user || user.status !== 'ACTIVE' || !user.passwordHash) {
      throw AppError.notFound('No account found with this email address.');
    }

    const isMatch = await bcrypt.compare(oldPasswordPlain, user.passwordHash);
    if (!isMatch) {
      throw AppError.badRequest('Old password does not match.');
    }

    const passwordHash = await bcrypt.hash(newPasswordPlain, 10);
    await authRepository.updatePasswordAndClearResetToken(user._id.toString(), passwordHash);

    await auditService.log({
      entity: 'USER',
      entityId: user._id.toString(),
      action: 'PASSWORD_RESET_COMPLETED',
      userId: user._id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      ip,
      userAgent,
    });

    return {
      message: 'Password updated successfully. You can now sign in with your new password.',
    };
  }

  public async verifyResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    if (!token) {
      throw AppError.badRequest('Password reset token is required.');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await authRepository.findByValidResetToken(hashedToken);

    if (!user) {
      throw AppError.badRequest('This password reset link is invalid or has expired. Please request a new link.');
    }

    return { valid: true, email: user.email };
  }

  public async resetPassword(token: string, newPasswordPlain: string, ip?: string, userAgent?: string): Promise<{ message: string }> {
    if (!token) {
      throw AppError.badRequest('Password reset token is required.');
    }

    if (!newPasswordPlain || newPasswordPlain.length < 8) {
      throw AppError.badRequest('New password must be at least 8 characters long.');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await authRepository.findByValidResetToken(hashedToken);

    if (!user) {
      throw AppError.badRequest('This password reset link is invalid or has expired. Please request a new link.');
    }

    const passwordHash = await bcrypt.hash(newPasswordPlain, 10);
    await authRepository.updatePasswordAndClearResetToken(user._id.toString(), passwordHash);

    await auditService.log({
      entity: 'USER',
      entityId: user._id.toString(),
      action: 'PASSWORD_RESET_COMPLETED',
      userId: user._id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      ip,
      userAgent,
    });

    return {
      message: 'Your password has been reset successfully. You can now sign in with your new password.',
    };
  }
}

export const authService = new AuthService();
