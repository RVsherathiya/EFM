import { Router } from 'express';
import mongoose from 'mongoose';
import { sendSuccess } from '../utils/response.js';

const router = Router();

router.get('/', (_req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  sendSuccess(res, {
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'EFM Backend API',
    database: dbStatus,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

export default router;
