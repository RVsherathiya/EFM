import { Router } from 'express';
import { reportsController } from './reports.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/timesheet', reportsController.getTimesheetReport);
router.get('/project-effort', reportsController.getProjectEffortReport);
router.get('/utilisation', reportsController.getUtilisationReport);
router.get('/category-breakdown', reportsController.getCategoryBreakdown);
router.get('/billable-summary', reportsController.getBillableSummary);

export default router;
