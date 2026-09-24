import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app/app.js';
import { User } from '../src/models/User.model.js';
import { UserHierarchy } from '../src/models/UserHierarchy.model.js';
import { hierarchyService } from '../src/domain/hierarchy/hierarchy.service.js';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from './db-helper.js';

describe('Auth & Server-Side Visibility Scope Engine (BR-SCOPE)', () => {
  const app = createApp();

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('BR-AUTH-001: should login successfully and return access token and user info', async () => {
    const passwordHash = await bcrypt.hash('Secret123', 10);
    await User.create({
      employeeCode: 'EMP-001',
      email: 'john@portal.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Doe',
      designation: 'Software Engineer',
      level: 'L3',
      roles: ['EMPLOYEE'],
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'john@portal.com', password: 'Secret123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe('john@portal.com');
    expect(res.body.data.user.passwordHash).toBeUndefined(); // Password hash must never be returned!
  });

  it('BR-SCOPE-006: an Employee should NOT be able to view a Peer employee by ID manipulation', async () => {
    const passwordHash = await bcrypt.hash('Secret123', 10);

    const emp1 = await User.create({
      employeeCode: 'EMP-001',
      email: 'emp1@portal.com',
      passwordHash,
      firstName: 'Emp',
      lastName: 'One',
      designation: 'Software Engineer',
      level: 'L2',
      roles: ['EMPLOYEE'],
    });

    const emp2 = await User.create({
      employeeCode: 'EMP-002',
      email: 'emp2@portal.com',
      passwordHash,
      firstName: 'Emp',
      lastName: 'Two',
      designation: 'Software Engineer',
      level: 'L2',
      roles: ['EMPLOYEE'],
    });

    // Login as emp1
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'emp1@portal.com', password: 'Secret123' });

    const token = loginRes.body.data.accessToken;

    // Try to access own profile
    const selfRes = await request(app)
      .get(`/api/v1/users/${emp1._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(selfRes.status).toBe(200);
    expect(selfRes.body.data.email).toBe('emp1@portal.com');

    // Try to access peer (emp2) profile -> Must return 403 Forbidden!
    const peerRes = await request(app)
      .get(`/api/v1/users/${emp2._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(peerRes.status).toBe(403);
    expect(peerRes.body.success).toBe(false);
  });

  it('BR-SCOPE-002: Senior Manager can view themselves and their direct/indirect subordinates', async () => {
    const passwordHash = await bcrypt.hash('Secret123', 10);

    const senior = await User.create({
      employeeCode: 'SNR-001',
      email: 'senior@portal.com',
      passwordHash,
      firstName: 'Senior',
      lastName: 'Manager',
      designation: 'Engineering Manager',
      level: 'L5',
      roles: ['SENIOR'],
    });

    const report = await User.create({
      employeeCode: 'DEV-001',
      email: 'dev@portal.com',
      passwordHash,
      firstName: 'Direct',
      lastName: 'Report',
      designation: 'Software Engineer',
      level: 'L2',
      managerId: senior._id,
      roles: ['EMPLOYEE'],
    });

    await hierarchyService.rebuildHierarchyTree();

    // Login as senior
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'senior@portal.com', password: 'Secret123' });

    const token = loginRes.body.data.accessToken;

    // Senior accesses report
    const reportRes = await request(app)
      .get(`/api/v1/users/${report._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(reportRes.status).toBe(200);
    expect(reportRes.body.data.email).toBe('dev@portal.com');
  });
});
