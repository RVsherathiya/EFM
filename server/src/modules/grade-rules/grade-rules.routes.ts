import { Router } from 'express';
import { gradeRulesController } from './grade-rules.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => gradeRulesController.getGradeRules(req, res).catch(next));
router.post('/simulate', (req, res, next) => gradeRulesController.simulateGrade(req, res).catch(next));

router.put('/', requireRoles('HR_ADMIN', 'SUPER_ADMIN'), (req, res, next) =>
  gradeRulesController.updateGradeRules(req, res).catch(next)
);

export default router;
