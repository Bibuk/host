'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/auth';
import type { UserUpdate, PasswordChange } from '@/types/api';
import { AxiosError } from 'axios';

interface ApiError {
  detail?: string;
  message?: string;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: UserUpdate) => usersApi.updateMe(data),
    onSuccess: (response) => {
      updateUser(response.data);
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
