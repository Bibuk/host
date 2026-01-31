import { apiClient } from './client';
import type { Notification, PaginatedResponse, MessageResponse } from '@/types/api';

export interface NotificationFilters {
  page?: number;
  page_size?: number;
  is_read?: boolean;
  type?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_type: {
    system: number;
    security: number;
    personal: number;
    broadcast: number;
  };
}

export const notificationsApi = {
  // Получить список уведомлений
  getAll: (filters?: NotificationFilters) =>
    apiClient.get<PaginatedResponse<Notification>>('/notifications', { params: filters }),

  // Получить одно уведомление
  getOne: (id: string) =>
    apiClient.get<Notification>(`/notifications/${id}`),

  // Получить статистику уведомлений
  getStats: () =>
    apiClient.get<NotificationStats>('/notifications/stats'),

  // Получить количество непрочитанных
  getUnreadCount: () =>
    apiClient.get<{ count: number }>('/notifications/unread-count'),

  // Отметить как прочитанное
  markAsRead: (id: string) =>
    apiClient.patch<Notification>(`/notifications/${id}/read`),

  // Отметить все как прочитанные
  markAllAsRead: () =>
    apiClient.post<MessageResponse>('/notifications/mark-all-read'),

  // Удалить уведомление
  delete: (id: string) =>
    apiClient.delete<MessageResponse>(`/notifications/${id}`),

  // Удалить все прочитанные
  deleteAllRead: () =>
    apiClient.delete<MessageResponse>('/notifications/read'),
};
