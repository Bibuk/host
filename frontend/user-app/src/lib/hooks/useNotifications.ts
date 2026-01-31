'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, type NotificationFilters } from '@/lib/api/notifications';
import { useToast } from '@/hooks/use-toast';
import { AxiosError } from 'axios';

interface ApiError {
  detail?: string;
  message?: string;
}

// Ключи для кеширования
const NOTIFICATIONS_KEY = 'notifications';
const NOTIFICATIONS_STATS_KEY = 'notificationsStats';
const NOTIFICATIONS_UNREAD_KEY = 'notificationsUnread';

// Получить список уведомлений
export function useNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: [NOTIFICATIONS_KEY, filters],
    queryFn: async () => {
      const { data } = await notificationsApi.getAll(filters);
      return data;
    },
    staleTime: 30 * 1000, // 30 секунд
  });
}

// Получить одно уведомление
export function useNotification(id: string) {
  return useQuery({
    queryKey: [NOTIFICATIONS_KEY, id],
    queryFn: async () => {
      const { data } = await notificationsApi.getOne(id);
      return data;
    },
    enabled: !!id,
  });
}

// Получить статистику уведомлений
export function useNotificationStats() {
  return useQuery({
    queryKey: [NOTIFICATIONS_STATS_KEY],
    queryFn: async () => {
      const { data } = await notificationsApi.getStats();
      return data;
    },
    staleTime: 30 * 1000,
  });
}

// Получить количество непрочитанных
export function useUnreadCount() {
  return useQuery({
    queryKey: [NOTIFICATIONS_UNREAD_KEY],
    queryFn: async () => {
      const { data } = await notificationsApi.getUnreadCount();
      return data.count;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Обновлять каждую минуту
  });
}

// Отметить как прочитанное
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_STATS_KEY] });
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_UNREAD_KEY] });
    },
  });
}

// Отметить все как прочитанные
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_STATS_KEY] });
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_UNREAD_KEY] });
      toast({ title: 'Все уведомления отмечены как прочитанные' });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.detail || 'Не удалось отметить уведомления',
        variant: 'destructive',
      });
    },
  });
}

// Удалить уведомление
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_STATS_KEY] });
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_UNREAD_KEY] });
      toast({ title: 'Уведомление удалено' });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.detail || 'Не удалось удалить уведомление',
        variant: 'destructive',
      });
    },
  });
}

// Удалить все прочитанные
export function useDeleteAllRead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: () => notificationsApi.deleteAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_STATS_KEY] });
      toast({ title: 'Прочитанные уведомления удалены' });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.detail || 'Не удалось удалить уведомления',
        variant: 'destructive',
      });
    },
  });
}
