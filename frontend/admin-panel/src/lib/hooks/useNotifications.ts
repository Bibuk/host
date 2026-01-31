'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/notifications';
import type { 
  SendNotificationRequest, 
  BroadcastNotificationRequest,
  ListNotificationsParams,
} from '@/lib/api/notifications';
import { useToast } from '@/hooks/use-toast';
import type { NotificationType, NotificationPriority } from '@/types/api';
import { AxiosError } from 'axios';

interface ApiError {
  detail?: string;
  message?: string;
}

interface UseNotificationsParams {
  page?: number;
  pageSize?: number;
  userId?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
}

export function useNotifications(params: UseNotificationsParams = {}) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationsApi.list({
      page: params.page,
      page_size: params.pageSize,
      user_id: params.userId,
      type: params.type,
      priority: params.priority,
    }).then((res) => res.data),
  });
}

export function useNotificationStats() {
  return useQuery({
    queryKey: ['notifications', 'stats'],
    queryFn: () => notificationsApi.getStats().then((res) => res.data),
  });
}

export function useSendNotification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: SendNotificationRequest) => notificationsApi.send(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ 
        title: 'Уведомление отправлено',
        description: `Отправлено ${response.data.sent_count} уведомлений`,
      });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast({ 
        title: 'Ошибка', 
        description: error.response?.data?.detail || 'Не удалось отправить уведомление',
        variant: 'destructive' 
      });
    },
  });
}

export function useBroadcastNotification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: BroadcastNotificationRequest) => notificationsApi.broadcast(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ 
        title: 'Рассылка выполнена',
        description: `Отправлено ${response.data.sent_count} уведомлений`,
      });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast({ 
        title: 'Ошибка', 
        description: error.response?.data?.detail || 'Не удалось выполнить рассылку',
        variant: 'destructive' 
      });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: 'Уведомление удалено' });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast({ 
        title: 'Ошибка', 
        description: error.response?.data?.detail || 'Не удалось удалить уведомление',
        variant: 'destructive' 
      });
    },
  });
}

export function useDeleteNotifications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (ids: string[]) => notificationsApi.deleteMany(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: 'Уведомления удалены' });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast({ 
        title: 'Ошибка', 
        description: error.response?.data?.detail || 'Не удалось удалить уведомления',
        variant: 'destructive' 
      });
    },
  });
}
