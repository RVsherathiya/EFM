import bcrypt from 'bcryptjs';
import { authRepository } from './auth.repository.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/token.util.js';
import { AppError } from '../../utils/app-error.js';
import { auditService } from '../../services/audit.service.js';
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
}

export const authService = new AuthService();
