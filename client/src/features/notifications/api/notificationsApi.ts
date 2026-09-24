import { apiClient } from '../../../lib/api/apiClient';

export interface NotificationDto {
  _id: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string;
  readAt?: string;
  createdAt: string;
}

export const notificationsApi = {
  getMyNotifications: async (limit: number = 30) => {
    const res = await apiClient.get<{
      success: boolean;
      data: { notifications: NotificationDto[]; unreadCount: number };
    }>('/notifications', { params: { limit } });
    return res.data;
  },

  markAsRead: async (id: string) => {
    const res = await apiClient.patch<{ success: boolean; data: NotificationDto }>(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await apiClient.patch<{ success: boolean; message: string }>('/notifications/read-all');
    return res.data;
  },
};
