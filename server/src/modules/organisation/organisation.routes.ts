import { Router } from 'express';
import { organisationController } from './organisation.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/tree', (req, res, next) => organisationController.getOrgTree(req, res, next));
router.get('/team', (req, res, next) => organisationController.getMyTeam(req, res, next));

export default router;
