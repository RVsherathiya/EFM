import { Router } from 'express';
import { criteriaController } from './criteria.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => criteriaController.getCriteria(req, res).catch(next));

router.post('/', requireRoles('HR_ADMIN', 'SUPER_ADMIN'), (req, res, next) =>
  criteriaController.createCriterion(req, res).catch(next)
);
router.patch('/:id', requireRoles('HR_ADMIN', 'SUPER_ADMIN'), (req, res, next) =>
  criteriaController.updateCriterion(req, res).catch(next)
);
router.delete('/:id', requireRoles('HR_ADMIN', 'SUPER_ADMIN'), (req, res, next) =>
  criteriaController.deleteCriterion(req, res).catch(next)
);

export default router;
