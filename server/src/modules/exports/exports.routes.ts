import { Router } from 'express';
import { exportsController } from './exports.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/timesheet', exportsController.exportTimesheet);
router.get('/project-effort', exportsController.exportProjectEffort);
router.get('/utilisation', exportsController.exportUtilisation);

export default router;
