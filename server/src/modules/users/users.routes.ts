import { Router } from 'express';
import { usersController } from './users.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/role.middleware.js';
import { USER_ROLES } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

// List users (scope filtered)
router.get('/', (req, res, next) => usersController.getUsers(req, res, next));

// Get user by ID (scope checked)
router.get('/:id', (req, res, next) => usersController.getUserById(req, res, next));

// Create employee (HR_ADMIN, SUPER_ADMIN)
router.post(
  '/',
  requireRoles(USER_ROLES.HR_ADMIN, USER_ROLES.SUPER_ADMIN),
  (req, res, next) => usersController.createUser(req, res, next)
);

// Update employee (HR_ADMIN, SUPER_ADMIN)
router.patch(
  '/:id',
  requireRoles(USER_ROLES.HR_ADMIN, USER_ROLES.SUPER_ADMIN),
  (req, res, next) => usersController.updateUser(req, res, next)
);

// Update employee manager (HR_ADMIN, SUPER_ADMIN)
router.patch(
  '/:id/manager',
  requireRoles(USER_ROLES.HR_ADMIN, USER_ROLES.SUPER_ADMIN),
  (req, res, next) => usersController.updateManager(req, res, next)
);

// Import employees CSV/XLSX preview/commit (HR_ADMIN, SUPER_ADMIN)
router.post(
  '/import',
  requireRoles(USER_ROLES.HR_ADMIN, USER_ROLES.SUPER_ADMIN),
  (req, res, next) => usersController.importUsers(req, res, next)
);

export default router;
