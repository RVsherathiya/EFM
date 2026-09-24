import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app/app.js';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from './db-helper.js';
import { User } from '../src/models/User.model.js';
import { Department } from '../src/models/Department.model.js';
import { Criterion } from '../src/models/Criterion.model.js';
import { generateAccessToken } from '../src/utils/token.util.js';

describe('Appraisal Review Workflow & Calibration (Phase 4, 5, 6)', () => {
  const app = createApp();

  let hrToken: string;
  let seniorToken: string;
  let pmToken: string;
  let devToken: string;
  let hrUser: any;
  let seniorUser: any;
  let pmUser: any;
  let devUser: any;
  let criterionId: string;

  beforeAll(async () => {
    await setupTestDatabase();

    const dept = await Department.create({ name: 'Engineering', code: 'ENG' });

    hrUser = await User.create({
      email: 'hr@corp.com',
      passwordHash: 'hash123',
      firstName: 'Helen',
      lastName: 'HR',
      employeeCode: 'EMP-HR',
      roles: ['HR_ADMIN'],
      departmentId: dept._id,
      designation: 'HR Lead',
      level: 'L6',
    });

    seniorUser = await User.create({
      email: 'senior@corp.com',
      passwordHash: 'hash123',
      firstName: 'Sarah',
      lastName: 'Senior',
      employeeCode: 'EMP-SR',
      roles: ['SENIOR'],
      departmentId: dept._id,
      designation: 'Senior Engineering Manager',
      level: 'L6',
    });

    pmUser = await User.create({
      email: 'pm@corp.com',
      passwordHash: 'hash123',
      firstName: 'Paul',
      lastName: 'PM',
      employeeCode: 'EMP-PM',
      roles: ['PM'],
      departmentId: dept._id,
      designation: 'Project Manager',
      level: 'L5',
    });

    devUser = await User.create({
      email: 'dev@corp.com',
      passwordHash: 'hash123',
      firstName: 'Dan',
      lastName: 'Developer',
      employeeCode: 'EMP-DEV',
      roles: ['EMPLOYEE'],
      departmentId: dept._id,
      designation: 'Software Engineer',
      level: 'L3',
      managerId: seniorUser._id,
    });

    const criterion = await Criterion.create({
      name: 'Quality of Work',
      description: 'Code quality and testing',
      weight: 100,
      sortOrder: 1,
      isActive: true,
    });
    criterionId = criterion._id.toString();

    hrToken = generateAccessToken({
      userId: hrUser._id,
      email: hrUser.email,
      roles: hrUser.roles,
    });

    seniorToken = generateAccessToken({
      userId: seniorUser._id,
      email: seniorUser.email,
      roles: seniorUser.roles,
    });

    pmToken = generateAccessToken({
      userId: pmUser._id,
      email: pmUser.email,
      roles: pmUser.roles,
    });

    devToken = generateAccessToken({
      userId: devUser._id,
      email: devUser.email,
      roles: devUser.roles,
    });
  });

  afterAll(async () => {
    await clearTestDatabase();
    await teardownTestDatabase();
  });

  it('End-to-End Review Workflow: Cycle Open -> Self -> Senior -> Send-Back limit -> PM -> Grade -> Override -> Publish -> Acknowledge', async () => {
    // 1. HR Creates Cycle
    const cycleRes = await request(app)
      .post('/api/v1/cycles')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        year: 2026,
        cycleNumber: 1,
        name: '2026-C1 Appraisal Cycle',
        periodStart: '2026-01-01',
        periodEnd: '2026-02-28',
        selfReviewStart: '2026-03-01',
        selfReviewEnd: '2026-03-05',
        seniorReviewStart: '2026-03-06',
        seniorReviewEnd: '2026-03-10',
        pmReviewStart: '2026-03-11',
        pmReviewEnd: '2026-03-14',
        gradeCalibrationStart: '2026-03-15',
        gradeCalibrationEnd: '2026-03-17',
        publishDate: '2026-03-18',
      });

    expect(cycleRes.status).toBe(201);
    const cycleId = cycleRes.body.data._id;

    // 2. HR Opens Cycle -> Initiates Review for Dan (assigned Senior: Sarah)
    const openRes = await request(app)
      .post(`/api/v1/cycles/${cycleId}/open`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(openRes.status).toBe(200);

    // 3. Dan fetches my reviews
    const myReviewsRes = await request(app)
      .get('/api/v1/reviews/my')
      .set('Authorization', `Bearer ${devToken}`);

    expect(myReviewsRes.status).toBe(200);
    expect(myReviewsRes.body.data.length).toBeGreaterThanOrEqual(1);
    const reviewId = myReviewsRes.body.data[0]._id;

    // Assign PM to the review for testing PM workflow
    const { Review } = await import('../src/models/Review.model.js');
    await Review.findByIdAndUpdate(reviewId, { pmId: pmUser._id });

    // 4. Dan submits Self Review with score 5 WITHOUT comment -> Expect rejection (BR-REVIEW-004)
    const failSelfRes = await request(app)
      .put(`/api/v1/reviews/${reviewId}/self`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({
        ratings: [{ criterionId, score: 5, comment: '' }],
        isDraft: false,
      });

    expect(failSelfRes.status).toBe(400);

    // 5. Dan submits Self Review with proper comment
    const successSelfRes = await request(app)
      .put(`/api/v1/reviews/${reviewId}/self`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({
        ratings: [{ criterionId, score: 5, comment: 'Delivered high performance modules on time.' }],
        achievements: 'Launched project X ahead of schedule.',
        isDraft: false,
      });

    expect(successSelfRes.status).toBe(200);

    // 6. Senior submits review
    const seniorRes = await request(app)
      .put(`/api/v1/reviews/${reviewId}/senior`)
      .set('Authorization', `Bearer ${seniorToken}`)
      .send({
        ratings: [{ criterionId, score: 4, comment: 'Good quality code.' }],
        strengths: 'Fast learner and proactive.',
        isDraft: false,
      });

    expect(seniorRes.status).toBe(200);

    // 7. PM sends review back to Senior with mandatory reason (BR-REVIEW-002)
    const sendBackRes = await request(app)
      .post(`/api/v1/reviews/${reviewId}/send-back`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ reason: 'Please reassess communication score with client team.' });

    expect(sendBackRes.status).toBe(200);

    // 8. Senior resubmits review
    await request(app)
      .put(`/api/v1/reviews/${reviewId}/senior`)
      .set('Authorization', `Bearer ${seniorToken}`)
      .send({
        ratings: [{ criterionId, score: 5, comment: 'Reassessed with client feedback - excellent performance.' }],
        isDraft: false,
      });

    // 9. PM tries to send back AGAIN -> Expect 400 (BR-REVIEW-002: Maximum 1 send-back allowed)
    const secondSendBack = await request(app)
      .post(`/api/v1/reviews/${reviewId}/send-back`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ reason: 'Second send back attempt' });

    expect(secondSendBack.status).toBe(400);

    // 10. PM submits PM review -> triggers GradeEngine calculation
    const pmSubmitRes = await request(app)
      .put(`/api/v1/reviews/${reviewId}/pm`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({
        ratings: [{ criterionId, score: 5, comment: 'Outstanding technical contribution.' }],
        pmExceptionalContribution: true,
        isDraft: false,
      });

    expect(pmSubmitRes.status).toBe(200);

    // Verify Grade Calculated
    const reviewAfterGrade = await request(app)
      .get(`/api/v1/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(reviewAfterGrade.body.data.review.calculatedGrade).toBe('A+');
    expect(reviewAfterGrade.body.data.review.finalScore).toBe(100);

    // 11. HR Overrides Grade to A with mandatory reason (BR-GRADE-005)
    const overrideRes = await request(app)
      .post(`/api/v1/reviews/${reviewId}/override`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        grade: 'A',
        score: 94,
        reason: 'Normalized across all departmental L3 cohorts.',
      });

    expect(overrideRes.status).toBe(200);

    // 12. HR Publishes Review
    const publishRes = await request(app)
      .post(`/api/v1/reviews/${reviewId}/publish`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(publishRes.status).toBe(200);

    // 13. Dan views published review and acknowledges
    const ackRes = await request(app)
      .post(`/api/v1/reviews/${reviewId}/acknowledge`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ comments: 'Thank you for the appraisal feedback.' });

    expect(ackRes.status).toBe(200);
    expect(ackRes.body.data.status).toBe('ACKNOWLEDGED');
  });
});
