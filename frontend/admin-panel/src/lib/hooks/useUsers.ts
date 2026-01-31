'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { useToast } from '@/hooks/use-toast';
import type { User, UserStatus, UserCreate, UserUpdateAdmin, PasswordChange } from '@/types/api';
import { AxiosError } from 'axios';

interface ApiError {
  detail?: string;
  message?: string;
}

interface UseUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: UserStatus;
}

export function useUsers(params: UseUsersParams = {}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersApi.list({
      page: params.page,
      page_size: params.pageSize,
      search: params.search,
      status: params.status,
    }).then((res) => res.data),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.get(id).then((res) => res.data),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: UserCreate) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Пользователь создан' });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast({ 
        title: 'Ошибка', 
        description: error.response?.data?.detail || 'Не удалось создать пользователя',
        variant: 'destructive' 
      });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdateAdmin }) =>
      usersApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', id] });
      toast({ title: 'Пользователь обновлён' });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast({ 
        title: 'Ошибка', 
        description: error.response?.data?.detail || 'Не удалось обновить пользователя',
        variant: 'destructive' 
      });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, hardDelete = false }: { id: string; hardDelete?: boolean }) => 
      usersApi.delete(id, hardDelete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Пользователь удалён' });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast({ 
        title: 'Ошибка', 
        description: error.response?.data?.detail || 'Не удалось удалить пользователя',
        variant: 'destructive' 
      });
    },
  });
}

export function useChangePassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: PasswordChange) => usersApi.changePassword(data),
    onSuccess: () => {
      toast({ title: 'Пароль изменён' });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast({ 
        title: 'Ошибка', 
        description: error.response?.data?.detail || 'Неверный текущий пароль',
        variant: 'destructive' 
      });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Partial<User>) => usersApi.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast({ title: 'Профиль обновлён' });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast({ 
        title: 'Ошибка', 
        description: error.response?.data?.detail || 'Не удалось обновить профиль',
        variant: 'destructive' 
      });
    },
  });
}
