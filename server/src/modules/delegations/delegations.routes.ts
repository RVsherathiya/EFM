import { Router } from 'express';
import { delegationsController } from './delegations.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => delegationsController.getDelegations(req, res, next));
router.post('/', (req, res, next) => delegationsController.createDelegation(req, res, next));
router.patch('/:id/revoke', (req, res, next) => delegationsController.revokeDelegation(req, res, next));

export default router;
