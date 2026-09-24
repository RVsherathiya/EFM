import { Notification, INotification, NotificationType } from '../../models/Notification.model.js';
import { Types } from 'mongoose';

export class NotificationsService {
  /**
   * Create an in-app notification
   */
  async createNotification(params: {
    recipientId: string | Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    linkUrl?: string;
    metadata?: Record<string, any>;
  }): Promise<INotification> {
    return Notification.create({
      recipientId: new Types.ObjectId(params.recipientId),
      type: params.type,
      title: params.title,
      message: params.message,
      linkUrl: params.linkUrl,
      metadata: params.metadata || {},
    });
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string | Types.ObjectId, limit: number = 20) {
    const notifications = await Notification.find({
      recipientId: new Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipientId: new Types.ObjectId(userId),
      readAt: null,
    });

    return {
      notifications,
      unreadCount,
    };
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string, userId: string | Types.ObjectId) {
    return Notification.findOneAndUpdate(
      {
        _id: new Types.ObjectId(notificationId),
        recipientId: new Types.ObjectId(userId),
      },
      { readAt: new Date() },
      { new: true }
    );
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string | Types.ObjectId) {
    return Notification.updateMany(
      {
        recipientId: new Types.ObjectId(userId),
        readAt: null,
      },
      { readAt: new Date() }
    );
  }
}

export const notificationsService = new NotificationsService();
