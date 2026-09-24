import { Router } from 'express';
import { auditController } from './audit.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireRoles('HR_ADMIN', 'SUPER_ADMIN'));

router.get('/', auditController.getAuditLogs);

export default router;
