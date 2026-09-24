import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import usersRoutes from '../modules/users/users.routes.js';
import departmentsRoutes from '../modules/departments/departments.routes.js';
import organisationRoutes from '../modules/organisation/organisation.routes.js';
import delegationsRoutes from '../modules/delegations/delegations.routes.js';
import projectsRoutes from '../modules/projects/projects.routes.js';
import tasksRoutes from '../modules/tasks/tasks.routes.js';
import periodLocksRoutes from '../modules/tasks/period-locks.routes.js';

const router = Router();

// Base System Health Check
router.use('/health', healthRoutes);

// Phase 1 Routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/departments', departmentsRoutes);
router.use('/org', organisationRoutes);
router.use('/delegations', delegationsRoutes);

// Phase 2 Routes
router.use('/projects', projectsRoutes);

// Phase 3 Routes
router.use('/tasks', tasksRoutes);
router.use('/period-locks', periodLocksRoutes);

// Phase 4, 5, 6 Routes
import cyclesRoutes from '../modules/cycles/cycles.routes.js';
import criteriaRoutes from '../modules/criteria/criteria.routes.js';
import gradeRulesRoutes from '../modules/grade-rules/grade-rules.routes.js';
import reviewsRoutes from '../modules/reviews/reviews.routes.js';

router.use('/cycles', cyclesRoutes);
router.use('/criteria', criteriaRoutes);
router.use('/grade-rules', gradeRulesRoutes);
router.use('/reviews', reviewsRoutes);

// Phase 7, 8 Routes
import reportsRoutes from '../modules/reports/reports.routes.js';
import exportsRoutes from '../modules/exports/exports.routes.js';
import notificationsRoutes from '../modules/notifications/notifications.routes.js';
import auditRoutes from '../modules/audit/audit.routes.js';

router.use('/reports', reportsRoutes);
router.use('/exports', exportsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/audit-logs', auditRoutes);

export default router;
