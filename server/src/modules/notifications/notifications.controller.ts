import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service.js';
import { sendSuccess } from '../../utils/response.js';

export class NotificationsController {
  getMyNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      const data = await notificationsService.getUserNotifications(userId, limit);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      const { id } = req.params;

      const updated = await notificationsService.markAsRead(id, userId);
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!._id;
      await notificationsService.markAllAsRead(userId);
      sendSuccess(res, { message: 'All notifications marked as read' });
    } catch (err) {
      next(err);
    }
  };
}

export const notificationsController = new NotificationsController();
