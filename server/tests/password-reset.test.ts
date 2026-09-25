import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app/app.js';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from './db-helper.js';
import { User } from '../src/models/User.model.js';

describe('Password Reset Workflow', () => {
  const app = createApp();

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    // Create active test user
    const passwordHash = await bcrypt.hash('Password@123', 10);
    await User.create({
      employeeCode: 'EMP-001',
      email: 'admin@efm.portal',
      passwordHash,
      firstName: 'System',
      lastName: 'Admin',
      designation: 'CEO',
      level: 'L7',
      roles: ['SUPER_ADMIN'],
      status: 'ACTIVE',
    });
  });

  it('POST /api/v1/auth/forgot-password should dispatch reset token for valid email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'admin@efm.portal' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain('password reset instructions');

    const updatedUser = await User.findOne({ email: 'admin@efm.portal' }).select('+passwordResetToken +passwordResetExpires');
    expect(updatedUser?.passwordResetToken).toBeDefined();
    expect(updatedUser?.passwordResetExpires).toBeDefined();
  });

  it('POST /api/v1/auth/forgot-password should return safe message for non-existent email without error', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nonexistent@efm.portal' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('Full reset password and login cycle', async () => {
    // 1. Request reset
    const forgotRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'admin@efm.portal' });

    expect(forgotRes.status).toBe(200);
    const devResetUrl = forgotRes.body.data.devResetUrl;
    expect(devResetUrl).toBeDefined();
    const token = new URL(devResetUrl).searchParams.get('token')!;
    expect(token).toBeDefined();

    // 2. Verify token
    const verifyRes = await request(app)
      .get(`/api/v1/auth/verify-reset-token?token=${token}`);

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.valid).toBe(true);
    expect(verifyRes.body.data.email).toBe('admin@efm.portal');

    // 3. Reset password with strong new password
    const newPassword = 'NewStrongPassword@2026';
    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token,
        newPassword,
      });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);

    // 4. Verify token was cleared from DB
    const userAfterReset = await User.findOne({ email: 'admin@efm.portal' }).select('+passwordResetToken +passwordResetExpires');
    expect(userAfterReset?.passwordResetToken).toBeUndefined();

    // 5. Old password must fail
    const oldLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@efm.portal',
        password: 'Password@123',
      });
    expect(oldLoginRes.status).toBe(401);

    // 6. New password must successfully log in
    const newLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@efm.portal',
        password: newPassword,
      });
    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.data.accessToken).toBeDefined();
    expect(newLoginRes.body.data.user.email).toBe('admin@efm.portal');
  });

  it('POST /api/v1/auth/reset-password should reject invalid/expired token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: 'invalid-or-fake-token-12345',
        newPassword: 'ValidNewPassword@123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
