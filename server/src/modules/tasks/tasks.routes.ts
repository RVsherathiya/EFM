import { Router } from 'express';
import { tasksController } from './tasks.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/role.middleware.js';
import { USER_ROLES } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => tasksController.getTasks(req, res, next));
router.get('/timesheet', (req, res, next) => tasksController.getTimesheetMatrix(req, res, next));
router.post('/', (req, res, next) => tasksController.createTask(req, res, next));
router.patch('/:id', (req, res, next) => tasksController.updateTask(req, res, next));
router.post('/submit', (req, res, next) => tasksController.submitTasks(req, res, next));

// Approvals Queue
router.get('/approvals', requireRoles(USER_ROLES.SENIOR, USER_ROLES.PM, USER_ROLES.HR_ADMIN, USER_ROLES.SUPER_ADMIN), (req, res, next) =>
  tasksController.getApprovalsQueue(req, res, next)
);
router.post('/approve', requireRoles(USER_ROLES.SENIOR, USER_ROLES.PM, USER_ROLES.HR_ADMIN, USER_ROLES.SUPER_ADMIN), (req, res, next) =>
  tasksController.approveTasks(req, res, next)
);
router.post('/reject', requireRoles(USER_ROLES.SENIOR, USER_ROLES.PM, USER_ROLES.HR_ADMIN, USER_ROLES.SUPER_ADMIN), (req, res, next) =>
  tasksController.rejectTasks(req, res, next)
);

export default router;
