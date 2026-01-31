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
    apiClient.get<PaginatedResponse<Notification>>('/notifications', { params }),

  // Get notification statistics
  getStats: () =>
    apiClient.get<NotificationStatsResponse>('/notifications/stats'),

  // Send notification to specific users
  send: (data: SendNotificationRequest) =>
    apiClient.post<SendNotificationResponse>('/notifications/send', data),

  // Broadcast notification to all users
  broadcast: (data: BroadcastNotificationRequest) =>
    apiClient.post<SendNotificationResponse>('/notifications/broadcast', data),

  // Delete single notification
  delete: (id: string) =>
    apiClient.delete<MessageResponse>(`/notifications/${id}`),

  // Delete multiple notifications
  deleteMany: (ids: string[]) =>
    apiClient.delete<MessageResponse>('/notifications', {
      params: { notification_ids: ids },
    }),
};
