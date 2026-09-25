import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authRateLimiter } from '../../middleware/rate-limit.middleware.js';

const router = Router();

router.post('/login', authRateLimiter, (req, res, next) => authController.login(req, res, next));
router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));
router.post('/logout', (req, res, next) => authController.logout(req, res, next));
router.get('/me', authenticate, (req, res, next) => authController.getMe(req, res, next));
router.post('/forgot-password', authRateLimiter, (req, res, next) => authController.forgotPassword(req, res, next));
router.get('/verify-reset-token', (req, res, next) => authController.verifyResetToken(req, res, next));
router.post('/reset-password', authRateLimiter, (req, res, next) => authController.resetPassword(req, res, next));
router.post('/reset-password-with-old', authRateLimiter, (req, res, next) => authController.resetPasswordWithOld(req, res, next));

export default router;
