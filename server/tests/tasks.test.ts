import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app/app.js';
import { User } from '../src/models/User.model.js';
import { Project } from '../src/models/Project.model.js';
import { ProjectMember } from '../src/models/ProjectMember.model.js';
import { Task } from '../src/models/Task.model.js';
import { hierarchyService } from '../src/domain/hierarchy/hierarchy.service.js';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from './db-helper.js';

describe('Task & Timesheet Domain Engine (Phase 3)', () => {
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

  it('BR-TASK-002: should reject task creation with a future date', async () => {
    const passwordHash = await bcrypt.hash('Secret123', 10);
    const dev = await User.create({
      employeeCode: 'DEV-001',
      email: 'dev@portal.com',
      passwordHash,
      firstName: 'Dave',
      lastName: 'Dev',
      designation: 'Developer',
      level: 'L3',
      roles: ['EMPLOYEE'],
    });

    const project = await Project.create({
      projectCode: 'PRJ-2026-001',
      name: 'Project Alpha',
      client: 'Acme',
      type: 'CLIENT',
      billingModel: 'TIME_AND_MATERIAL',
      startDate: new Date('2026-01-01'),
      projectManagerId: dev._id,
    });

    await ProjectMember.create({
      projectId: project._id,
      userId: dev._id,
      projectRole: 'Dev',
      allocationPct: 100,
      defaultBillable: true,
      startDate: new Date('2026-01-01'),
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'dev@portal.com', password: 'Secret123' });

    const token = loginRes.body.data.accessToken;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    const createRes = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        projectId: project._id.toString(),
        workDate: futureDate.toISOString().split('T')[0],
        title: 'Future Feature Implementation',
        description: 'Working on future items',
        category: 'Development',
        hours: 4.0,
      });

    expect(createRes.status).toBe(400);
    expect(createRes.body.error.message).toMatch(/cannot be in the future/);
  });

  it('BR-TASK-001: should reject non-0.25 increment hours (e.g. 1.33 hours)', async () => {
    const passwordHash = await bcrypt.hash('Secret123', 10);
    const dev = await User.create({
      employeeCode: 'DEV-002',
      email: 'dev2@portal.com',
      passwordHash,
      firstName: 'Dave2',
      lastName: 'Dev',
      designation: 'Developer',
      level: 'L3',
      roles: ['EMPLOYEE'],
    });

    const project = await Project.create({
      projectCode: 'PRJ-2026-002',
      name: 'Project Beta',
      client: 'Acme',
      type: 'CLIENT',
      billingModel: 'TIME_AND_MATERIAL',
      startDate: new Date('2026-01-01'),
      projectManagerId: dev._id,
    });

    await ProjectMember.create({
      projectId: project._id,
      userId: dev._id,
      projectRole: 'Dev',
      allocationPct: 100,
      defaultBillable: true,
      startDate: new Date('2026-01-01'),
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'dev2@portal.com', password: 'Secret123' });

    const token = loginRes.body.data.accessToken;

    const createRes = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        projectId: project._id.toString(),
        workDate: new Date().toISOString().split('T')[0],
        title: 'Invalid hours increment',
        description: 'Should fail 0.25 increment validation',
        category: 'Development',
        hours: 1.33,
      });

    expect(createRes.status).toBe(400);
    expect(createRes.body.error.message).toMatch(/0.25 increments/);
  });

  it('BR-TASK-003 & BR-TASK-004: submitted task can be approved by PM and becomes immutable', async () => {
    const passwordHash = await bcrypt.hash('Secret123', 10);

    const pm = await User.create({
      employeeCode: 'PM-001',
      email: 'pm@portal.com',
      passwordHash,
      firstName: 'Peter',
      lastName: 'Manager',
      designation: 'PM',
      level: 'L5',
      roles: ['PM'],
    });

    const dev = await User.create({
      employeeCode: 'DEV-003',
      email: 'dev3@portal.com',
      passwordHash,
      firstName: 'Dan',
      lastName: 'Developer',
      designation: 'Developer',
      level: 'L3',
      roles: ['EMPLOYEE'],
    });

    const project = await Project.create({
      projectCode: 'PRJ-2026-003',
      name: 'Mobile Banking App',
      client: 'FinBank',
      type: 'CLIENT',
      billingModel: 'TIME_AND_MATERIAL',
      startDate: new Date('2026-01-01'),
      projectManagerId: pm._id,
    });

    await ProjectMember.create({
      projectId: project._id,
      userId: dev._id,
      projectRole: 'Dev',
      allocationPct: 100,
      defaultBillable: true,
      startDate: new Date('2026-01-01'),
    });

    await hierarchyService.rebuildHierarchyTree();

    // Dev logs and submits task
    const devLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'dev3@portal.com', password: 'Secret123' });

    const devToken = devLogin.body.data.accessToken;

    const taskRes = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${devToken}`)
      .send({
        projectId: project._id.toString(),
        workDate: new Date().toISOString().split('T')[0],
        title: 'Authentication module endpoints',
        description: 'Implemented JWT auth with refresh rotation',
        category: 'Development',
        hours: 6.5,
        submit: true,
      });

    expect(taskRes.status).toBe(201);
    expect(taskRes.body.data.status).toBe('SUBMITTED');

    const taskId = taskRes.body.data._id;

    // PM approves task
    const pmLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'pm@portal.com', password: 'Secret123' });

    const pmToken = pmLogin.body.data.accessToken;

    const approveRes = await request(app)
      .post('/api/v1/tasks/approve')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({
        taskIds: [taskId],
        action: 'APPROVE_BILLABLE',
      });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.approvedCount).toBe(1);

    const approvedTask = await Task.findById(taskId);
    expect(approvedTask?.status).toBe('APPROVED');
    expect(approvedTask?.approvalStatus).toBe('APPROVED_BILLABLE');
    expect(approvedTask?.billable).toBe(true);

    // Dev tries to edit approved task -> Must fail with 400 (BR-TASK-003)
    const editRes = await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ hours: 8.0 });

    expect(editRes.status).toBe(400);
    expect(editRes.body.error.message).toMatch(/Approved tasks are immutable/);
  });
});
