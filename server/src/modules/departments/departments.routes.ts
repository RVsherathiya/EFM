import { Router } from 'express';
import { departmentsController } from './departments.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/role.middleware.js';
import { USER_ROLES } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => departmentsController.getDepartments(req, res, next));
router.get('/:id', (req, res, next) => departmentsController.getDepartmentById(req, res, next));

router.post(
  '/',
  requireRoles(USER_ROLES.HR_ADMIN, USER_ROLES.SUPER_ADMIN),
  (req, res, next) => departmentsController.createDepartment(req, res, next)
);

router.patch(
  '/:id',
  requireRoles(USER_ROLES.HR_ADMIN, USER_ROLES.SUPER_ADMIN),
  (req, res, next) => departmentsController.updateDepartment(req, res, next)
);

export default router;
