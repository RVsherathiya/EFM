import { Router } from 'express';
import { tasksController } from './tasks.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/role.middleware.js';
import { USER_ROLES } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => tasksController.getPeriodLocks(req, res, next));
router.post(
  '/unlock',
  requireRoles(USER_ROLES.HR_ADMIN, USER_ROLES.SUPER_ADMIN),
  (req, res, next) => tasksController.unlockPeriod(req, res, next)
);

export default router;
