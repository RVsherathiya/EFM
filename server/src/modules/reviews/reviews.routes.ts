import { Router } from 'express';
import { reviewsController } from './reviews.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/my', (req, res, next) => reviewsController.getMyReviews(req, res).catch(next));
router.get('/pending', (req, res, next) => reviewsController.getPendingReviews(req, res).catch(next));
router.get('/calibration', requireRoles('HR_ADMIN', 'SUPER_ADMIN'), (req, res, next) =>
  reviewsController.getCalibrationReviews(req, res).catch(next)
);
router.get('/:id', (req, res, next) => reviewsController.getReviewDetail(req, res).catch(next));

router.put('/:id/self', (req, res, next) => reviewsController.submitSelf(req, res).catch(next));
router.put('/:id/senior', (req, res, next) => reviewsController.submitSenior(req, res).catch(next));
router.put('/:id/pm', (req, res, next) => reviewsController.submitPM(req, res).catch(next));
router.post('/:id/send-back', (req, res, next) => reviewsController.sendBack(req, res).catch(next));

router.post('/:id/override', requireRoles('HR_ADMIN', 'SUPER_ADMIN'), (req, res, next) =>
  reviewsController.override(req, res).catch(next)
);
router.post('/:id/publish', requireRoles('HR_ADMIN', 'SUPER_ADMIN'), (req, res, next) =>
  reviewsController.publish(req, res).catch(next)
);

router.post('/:id/acknowledge', (req, res, next) => reviewsController.acknowledge(req, res).catch(next));
router.post('/:id/dispute', (req, res, next) => reviewsController.dispute(req, res).catch(next));

export default router;
