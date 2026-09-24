import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app/app.js';
import { User } from '../src/models/User.model.js';
import { Project } from '../src/models/Project.model.js';
import { ProjectMember } from '../src/models/ProjectMember.model.js';
import { ProjectDocument } from '../src/models/ProjectDocument.model.js';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from './db-helper.js';

describe('Project Management & Document Engine (Phase 2)', () => {
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

  it('BR-PROJ-001: should create project with auto-generated code (PRJ-YYYY-XXX)', async () => {
    const passwordHash = await bcrypt.hash('Secret123', 10);
    const pm = await User.create({
      employeeCode: 'PM-001',
      email: 'pm@portal.com',
      passwordHash,
      firstName: 'Project',
      lastName: 'Manager',
      designation: 'PM',
      level: 'L5',
      roles: ['PM'],
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'pm@portal.com', password: 'Secret123' });

    const token = loginRes.body.data.accessToken;

    const createRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Enterprise Cloud Migration',
        client: 'Global Logistics Corp',
        type: 'CLIENT',
        billingModel: 'TIME_AND_MATERIAL',
        startDate: '2026-01-01',
        projectManagerId: pm._id.toString(),
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.projectCode).toMatch(/^PRJ-\d{4}-001$/);
    expect(createRes.body.data.name).toBe('Enterprise Cloud Migration');

    // Verify PM was automatically assigned as project member
    const members = await ProjectMember.find({ projectId: createRes.body.data._id });
    expect(members.length).toBe(1);
    expect(members[0].userId.toString()).toBe(pm._id.toString());
  });

  it('BR-PROJ-005: uploading document with same title creates new version without deleting previous', async () => {
    const passwordHash = await bcrypt.hash('Secret123', 10);
    const pm = await User.create({
      employeeCode: 'PM-002',
      email: 'pm2@portal.com',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Connor',
      designation: 'PM',
      level: 'L5',
      roles: ['PM'],
    });

    const project = await Project.create({
      projectCode: 'PRJ-2026-002',
      name: 'Mobile App Revamp',
      client: 'Retail Co',
      type: 'CLIENT',
      billingModel: 'FIXED_PRICE',
      startDate: new Date(),
      projectManagerId: pm._id,
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'pm2@portal.com', password: 'Secret123' });

    const token = loginRes.body.data.accessToken;

    // Upload v1
    const v1Res = await request(app)
      .post(`/api/v1/projects/${project._id}/documents`)
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Architecture Specification')
      .field('category', 'Technical')
      .attach('file', Buffer.from('Architecture v1 content'), 'architecture.txt');

    expect(v1Res.status).toBe(201);
    expect(v1Res.body.data.version).toBe(1);

    // Upload v2 with same title
    const v2Res = await request(app)
      .post(`/api/v1/projects/${project._id}/documents`)
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Architecture Specification')
      .field('category', 'Technical')
      .attach('file', Buffer.from('Architecture v2 content revised'), 'architecture.txt');

    expect(v2Res.status).toBe(201);
    expect(v2Res.body.data.version).toBe(2);

    // Verify both versions exist in database
    const allDocs = await ProjectDocument.find({ projectId: project._id, title: 'Architecture Specification' });
    expect(allDocs.length).toBe(2);
  });
});
