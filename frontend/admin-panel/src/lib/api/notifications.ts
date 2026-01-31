import { apiClient } from './client';
import type {
  Notification,
  NotificationType,
  NotificationPriority,
  PaginatedResponse,
  MessageResponse,
} from '@/types/api';

// Request types
export interface SendNotificationRequest {
  user_ids: string[];
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  action_url?: string | null;
}

export interface BroadcastNotificationRequest {
  title: string;
  message: string;
  priority?: NotificationPriority;
  action_url?: string | null;
  exclude_user_ids?: string[];
}

// Response types
export interface SendNotificationResponse {
  sent_count: number;
  notification_ids: string[];
}

export interface NotificationStatsResponse {
  total: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
  unread_count: number;
}

// List params
export interface ListNotificationsParams {
  page?: number;
  page_size?: number;
  user_id?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
}

export const notificationsApi = {
  // List all notifications (admin)
  list: (params: ListNotificationsParams = {}) =>
    apiClient.get<PaginatedResponse<Notification>>('/notifications/admin/list', { params }),

  // Get notification statistics (admin)
  getStats: () =>
    apiClient.get<NotificationStatsResponse>('/notifications/admin/stats'),

  // Send notification to specific users (admin)
  send: (data: SendNotificationRequest) =>
    apiClient.post<SendNotificationResponse>('/notifications/admin/send', data),

  // Broadcast notification to all users (admin)
  broadcast: (data: BroadcastNotificationRequest) =>
    apiClient.post<SendNotificationResponse>('/notifications/admin/broadcast', data),

  // Delete single notification (admin)
  delete: (id: string) =>
    apiClient.delete<MessageResponse>(`/notifications/admin/${id}`),

  // Delete multiple notifications (admin)
  deleteMany: (ids: string[]) =>
    apiClient.delete<MessageResponse>('/notifications/admin/bulk', {
      params: { notification_ids: ids },
    }),
};
