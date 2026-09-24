import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { User } from '../models/User.model.js';
import { Department } from '../models/Department.model.js';
import { UserHierarchy } from '../models/UserHierarchy.model.js';
import { Project } from '../models/Project.model.js';
import { ProjectMember } from '../models/ProjectMember.model.js';
import { Cycle } from '../models/Cycle.model.js';
import { Criterion } from '../models/Criterion.model.js';
import { GradeRule } from '../models/GradeRule.model.js';
import { Task } from '../models/Task.model.js';
import { Review } from '../models/Review.model.js';
import { ReviewRating } from '../models/ReviewRating.model.js';
import { ReviewFeedback } from '../models/ReviewFeedback.model.js';
import { hierarchyService } from '../domain/hierarchy/hierarchy.service.js';
import { logger } from '../config/logger.js';

export const seedDatabase = async () => {
  await connectDatabase();

  logger.info('🌱 Starting comprehensive EFM database seed...');

  // Clean existing collections
  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    UserHierarchy.deleteMany({}),
    Project.deleteMany({}),
    ProjectMember.deleteMany({}),
    Cycle.deleteMany({}),
    Criterion.deleteMany({}),
    GradeRule.deleteMany({}),
    Task.deleteMany({}),
    Review.deleteMany({}),
    ReviewRating.deleteMany({}),
    ReviewFeedback.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 1. Create Departments
  const engDept = await Department.create({
    name: 'Engineering',
    code: 'ENG',
    description: 'Software Engineering, QA, and DevOps',
  });

  const productDept = await Department.create({
    name: 'Product & Design',
    code: 'PROD',
    description: 'Product Management and UI/UX Design',
  });

  const hrDept = await Department.create({
    name: 'Human Resources',
    code: 'HR',
    description: 'Talent, People Operations, and Compliance',
  });

  // 2. Create Super Admin / CEO (L7)
  const superAdmin = await User.create({
    employeeCode: 'EMP-001',
    email: 'admin@efm.portal',
    passwordHash,
    firstName: 'System',
    lastName: 'Administrator',
    designation: 'Chief Executive Officer',
    level: 'L7',
    departmentId: hrDept._id,
    roles: ['SUPER_ADMIN', 'HR_ADMIN'],
  });

  // 3. Create HR Admin (L6)
  const hrAdmin = await User.create({
    employeeCode: 'EMP-002',
    email: 'hr@efm.portal',
    passwordHash,
    firstName: 'Sarah',
    lastName: 'Jenkins',
    designation: 'VP of Human Resources',
    level: 'L6',
    departmentId: hrDept._id,
    managerId: superAdmin._id,
    roles: ['HR_ADMIN'],
  });

  hrDept.headId = hrAdmin._id;
  await hrDept.save();

  // 4. Create Senior Manager / Engineering Director (L6)
  const seniorEng = await User.create({
    employeeCode: 'EMP-003',
    email: 'senior.eng@efm.portal',
    passwordHash,
    firstName: 'David',
    lastName: 'Chen',
    designation: 'Engineering Director',
    level: 'L6',
    departmentId: engDept._id,
    managerId: superAdmin._id,
    roles: ['SENIOR'],
  });

  engDept.headId = seniorEng._id;
  await engDept.save();

  // 5. Create Project Manager (L5)
  const pmUser = await User.create({
    employeeCode: 'EMP-004',
    email: 'pm@efm.portal',
    passwordHash,
    firstName: 'Rachel',
    lastName: 'Adams',
    designation: 'Senior Project Manager',
    level: 'L5',
    departmentId: productDept._id,
    managerId: superAdmin._id,
    roles: ['PM'],
  });

  productDept.headId = pmUser._id;
  await productDept.save();

  // 6. Create Tech Lead (L5)
  const techLead = await User.create({
    employeeCode: 'EMP-005',
    email: 'techlead@efm.portal',
    passwordHash,
    firstName: 'Marcus',
    lastName: 'Vance',
    designation: 'Principal Architect / Tech Lead',
    level: 'L5',
    departmentId: engDept._id,
    managerId: seniorEng._id,
    roles: ['SENIOR', 'EMPLOYEE'],
  });

  // 7. Create Software Engineers
  const dev1 = await User.create({
    employeeCode: 'EMP-006',
    email: 'dev1@efm.portal',
    passwordHash,
    firstName: 'Emily',
    lastName: 'Watson',
    designation: 'Senior Full Stack Engineer',
    level: 'L4',
    departmentId: engDept._id,
    managerId: techLead._id,
    roles: ['EMPLOYEE'],
  });

  const dev2 = await User.create({
    employeeCode: 'EMP-007',
    email: 'dev2@efm.portal',
    passwordHash,
    firstName: 'Alex',
    lastName: 'Rivera',
    designation: 'Frontend Engineer',
    level: 'L3',
    departmentId: engDept._id,
    managerId: techLead._id,
    roles: ['EMPLOYEE'],
  });

  const dev3 = await User.create({
    employeeCode: 'EMP-008',
    email: 'dev3@efm.portal',
    passwordHash,
    firstName: 'Priya',
    lastName: 'Sharma',
    designation: 'Backend Engineer',
    level: 'L3',
    departmentId: engDept._id,
    managerId: techLead._id,
    roles: ['EMPLOYEE'],
  });

  // 8. Rebuild Hierarchy Closure Table
  await hierarchyService.rebuildHierarchyTree();

  // 9. Create Projects
  const bankingProj = await Project.create({
    projectCode: 'PRJ-2026-001',
    name: 'NextGen Digital Banking Platform',
    client: 'Global FinTech Corp',
    type: 'CLIENT',
    billingModel: 'TIME_AND_MATERIAL',
    description: 'Cloud native microservices architecture for mobile and web retail banking.',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    status: 'ACTIVE',
    projectManagerId: pmUser._id,
    projectLeadId: techLead._id,
    departmentId: engDept._id,
  });

  const aiPortalProj = await Project.create({
    projectCode: 'PRJ-2026-002',
    name: 'Internal AI Knowledge Engine',
    client: 'Internal Operations',
    type: 'INTERNAL',
    billingModel: 'NON_BILLABLE',
    description: 'Internal generative AI workspace tool for corporate intelligence.',
    startDate: new Date('2026-02-01'),
    endDate: new Date('2026-11-30'),
    status: 'ACTIVE',
    projectManagerId: pmUser._id,
    projectLeadId: techLead._id,
    departmentId: engDept._id,
  });

  // 10. Assign Project Members
  await ProjectMember.create([
    {
      projectId: bankingProj._id,
      userId: dev1._id,
      projectRole: 'Full Stack Engineer',
      allocationPct: 80,
      defaultBillable: true,
      startDate: new Date('2026-01-01'),
    },
    {
      projectId: bankingProj._id,
      userId: dev2._id,
      projectRole: 'Frontend Engineer',
      allocationPct: 100,
      defaultBillable: true,
      startDate: new Date('2026-01-01'),
    },
    {
      projectId: bankingProj._id,
      userId: dev3._id,
      projectRole: 'Backend Engineer',
      allocationPct: 70,
      defaultBillable: true,
      startDate: new Date('2026-01-01'),
    },
    {
      projectId: aiPortalProj._id,
      userId: dev1._id,
      projectRole: 'AI Research Lead',
      allocationPct: 20,
      defaultBillable: false,
      startDate: new Date('2026-02-01'),
    },
  ]);

  // 11. Create Standard Criteria Library
  const defaultCriteria = await Criterion.create([
    {
      name: 'Quality of Work',
      description: 'Delivers reliable, clean, robust, well-architected solutions with minimal defects.',
      weight: 25,
      sortOrder: 1,
      isActive: true,
    },
    {
      name: 'Timeliness & Delivery',
      description: 'Consistently meets project milestones and sprint deliverables without uncommunicated delays.',
      weight: 20,
      sortOrder: 2,
      isActive: true,
    },
    {
      name: 'Technical / Functional Skill',
      description: 'Demonstrates deep domain knowledge, code craftsmanship, and modern engineering practices.',
      weight: 20,
      sortOrder: 3,
      isActive: true,
    },
    {
      name: 'Communication & Collaboration',
      description: 'Proactive team player, transparent updates, and cross-functional empathy.',
      weight: 15,
      sortOrder: 4,
      isActive: true,
    },
    {
      name: 'Ownership & Initiative',
      description: 'Takes end-to-end accountability and drives solutions beyond explicit instructions.',
      weight: 10,
      sortOrder: 5,
      isActive: true,
    },
    {
      name: 'Learning & Growth',
      description: 'Actively acquires new skills, incorporates feedback, and elevates team capabilities.',
      weight: 10,
      sortOrder: 6,
      isActive: true,
    },
  ]);

  // 12. Create Grade Rules
  await GradeRule.create([
    {
      grade: 'A+',
      priority: 1,
      minScore: 95,
      maxScore: 100,
      description: 'Score >= 95, No criterion < 4, Zero missed deadlines, PM exceptional contribution required',
      conditions: [
        { field: 'criterionScore', operator: 'allGte', value: 4, thresholdScore: 4 },
        { field: 'missedDeadlines', operator: 'eq', value: 0 },
        { field: 'pmExceptionalContribution', operator: 'eq', value: true },
      ],
      requiresHrApproval: true,
    },
    {
      grade: 'A',
      priority: 2,
      minScore: 90,
      maxScore: 94.99,
      description: 'Score 90-94.99, No criterion < 4, Max 1 missed deadline',
      conditions: [
        { field: 'criterionScore', operator: 'allGte', value: 4, thresholdScore: 4 },
        { field: 'missedDeadlines', operator: 'lte', value: 1 },
      ],
      requiresHrApproval: false,
    },
    {
      grade: 'A-',
      priority: 3,
      minScore: 85,
      maxScore: 89.99,
      description: 'Score 85-89.99, No criterion < 3',
      conditions: [{ field: 'criterionScore', operator: 'allGte', value: 3, thresholdScore: 3 }],
      requiresHrApproval: false,
    },
    {
      grade: 'B+',
      priority: 4,
      minScore: 80,
      maxScore: 84.99,
      description: 'Score 80-84.99, No criterion < 3',
      conditions: [{ field: 'criterionScore', operator: 'allGte', value: 3, thresholdScore: 3 }],
      requiresHrApproval: false,
    },
    {
      grade: 'B',
      priority: 5,
      minScore: 75,
      maxScore: 79.99,
      description: 'Score 75-79.99, Maximum 1 criterion < 3',
      conditions: [{ field: 'countCriteriaBelow', operator: 'countLte', value: 1, thresholdScore: 3 }],
      requiresHrApproval: false,
    },
    {
      grade: 'B-',
      priority: 6,
      minScore: 70,
      maxScore: 74.99,
      description: 'Score 70-74.99, Max 2 criteria < 3, Quality >= 3',
      conditions: [
        { field: 'countCriteriaBelow', operator: 'countLte', value: 2, thresholdScore: 3 },
        { field: 'qualityScore', operator: 'gte', value: 3, criterionName: 'Quality of Work' },
      ],
      requiresHrApproval: false,
    },
    {
      grade: 'C+',
      priority: 7,
      minScore: 65,
      maxScore: 69.99,
      description: 'Score 65-69.99, Quality >= 2',
      conditions: [{ field: 'qualityScore', operator: 'gte', value: 2, criterionName: 'Quality of Work' }],
      requiresHrApproval: false,
    },
    {
      grade: 'C',
      priority: 8,
      minScore: 60,
      maxScore: 64.99,
      description: 'Score 60-64.99, Self submitted or Senior justification required',
      conditions: [{ field: 'selfSubmitted', operator: 'eq', value: true }],
      requiresHrApproval: false,
    },
    {
      grade: 'C-',
      priority: 9,
      minScore: 0,
      maxScore: 59.99,
      description: 'Below 60 or no higher rule matches',
      conditions: [],
      requiresHrApproval: true,
    },
  ]);

  // 13. Create Active Cycle C1 2026
  const cycleC1 = await Cycle.create({
    name: '2026-C1 (Jan - Feb)',
    code: '2026-C1',
    year: 2026,
    cycleNumber: 1,
    periodStart: new Date('2026-01-01'),
    periodEnd: new Date('2026-02-28'),
    selfReviewStart: new Date('2026-03-01'),
    selfReviewEnd: new Date('2026-03-05'),
    seniorReviewStart: new Date('2026-03-06'),
    seniorReviewEnd: new Date('2026-03-10'),
    pmReviewStart: new Date('2026-03-11'),
    pmReviewEnd: new Date('2026-03-14'),
    gradeCalibrationStart: new Date('2026-03-15'),
    gradeCalibrationEnd: new Date('2026-03-17'),
    publishDate: new Date('2026-03-18'),
    status: 'OPEN',
    createdBy: hrAdmin._id,
  });

  // 14. Create Sample Tasks
  await Task.create([
    {
      userId: dev1._id,
      projectId: bankingProj._id,
      workDate: new Date('2026-02-15'),
      title: 'Implement OAuth2 PKCE Authentication Flow',
      description: 'Developed JWT token handling and refresh mechanism with rate limiters.',
      category: 'Development',
      hours: 7.5,
      billable: true,
      status: 'APPROVED',
      approvalStatus: 'APPROVED_BILLABLE',
      approvedBy: pmUser._id,
      approvedAt: new Date('2026-02-16'),
    },
    {
      userId: dev1._id,
      projectId: bankingProj._id,
      workDate: new Date('2026-02-16'),
      title: 'Setup Database Connection Pooling and Retry Logic',
      description: 'Configured replica set resilience and connection pool parameters.',
      category: 'Development',
      hours: 8.0,
      billable: true,
      status: 'APPROVED',
      approvalStatus: 'APPROVED_BILLABLE',
      approvedBy: pmUser._id,
      approvedAt: new Date('2026-02-17'),
    },
    {
      userId: dev1._id,
      projectId: aiPortalProj._id,
      workDate: new Date('2026-02-17'),
      title: 'Benchmark Vector Search Latency',
      description: 'Evaluated embedding search indexing performance on sample dataset.',
      category: 'Support',
      hours: 4.0,
      billable: false,
      status: 'APPROVED',
      approvalStatus: 'APPROVED_NON_BILLABLE',
      approvedBy: pmUser._id,
      approvedAt: new Date('2026-02-18'),
    },
  ]);

  // 15. Create Sample Review for Emily Watson (dev1)
  const sampleReview = await Review.create({
    cycleId: cycleC1._id,
    employeeId: dev1._id,
    seniorId: techLead._id,
    pmId: pmUser._id,
    status: 'SENIOR_PENDING',
    selfSubmittedAt: new Date('2026-03-03'),
    pmSendBackCount: 0,
    isDisputed: false,
  });

  // Seed Emily's self ratings
  for (const c of defaultCriteria) {
    await ReviewRating.create({
      reviewId: sampleReview._id,
      criterionId: c._id,
      reviewerType: 'SELF',
      reviewerId: dev1._id,
      score: 4,
      comment: `Consistently delivered milestones for ${c.name}.`,
    });
  }

  await ReviewFeedback.create({
    reviewId: sampleReview._id,
    reviewerType: 'SELF',
    reviewerId: dev1._id,
    achievements: 'Led core architecture for banking backend and delivered zero defect release.',
    strengths: 'Distributed system design, clean TypeScript architecture.',
    areasOfImprovement: 'Improve automated end-to-end load testing.',
    actionItems: 'Complete distributed caching certification.',
  });

  logger.info('🎉 Seed completed successfully!');
  logger.info('----------------------------------------------------');
  logger.info('Credentials for all users: Password@123');
  logger.info('Super Admin: admin@efm.portal (L7)');
  logger.info('HR Admin:    hr@efm.portal (L6)');
  logger.info('Senior Eng:  senior.eng@efm.portal (L6)');
  logger.info('PM:          pm@efm.portal (L5)');
  logger.info('Tech Lead:   techlead@efm.portal (L5)');
  logger.info('Developers:  dev1@efm.portal, dev2@efm.portal, dev3@efm.portal');
  logger.info('----------------------------------------------------');

  await disconnectDatabase();
};

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().catch((err) => {
    logger.error('Seed failed:', err);
    process.exit(1);
  });
}
