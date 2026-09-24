import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { env } from '../config/env.js';
import { UserRole } from '../config/constants.js';

export interface TokenPayload {
  userId: string;
  email: string;
  roles: UserRole[];
}

export const generateAccessToken = (payload: { userId: string | Types.ObjectId; email: string; roles: UserRole[] }): string => {
  return jwt.sign(
    {
      userId: payload.userId.toString(),
      email: payload.email,
      roles: payload.roles,
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: '15m',
    }
  );
};

export const generateRefreshToken = (payload: { userId: string | Types.ObjectId }): string => {
  return jwt.sign(
    {
      userId: payload.userId.toString(),
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: '7d',
    }
  );
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
};
