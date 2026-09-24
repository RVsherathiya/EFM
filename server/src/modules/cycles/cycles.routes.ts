import { Router } from 'express';
import { cyclesController } from './cycles.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => cyclesController.getCycles(req, res).catch(next));
router.get('/:id', (req, res, next) => cyclesController.getCycleById(req, res).catch(next));

// HR Admin / Super Admin routes
router.post('/', requireRoles('HR_ADMIN', 'SUPER_ADMIN'), (req, res, next) =>
  cyclesController.createCycle(req, res).catch(next)
);
router.post('/:id/open', requireRoles('HR_ADMIN', 'SUPER_ADMIN'), (req, res, next) =>
  cyclesController.openCycle(req, res).catch(next)
);
router.post('/:id/close', requireRoles('HR_ADMIN', 'SUPER_ADMIN'), (req, res, next) =>
  cyclesController.closeCycle(req, res).catch(next)
);

export default router;
