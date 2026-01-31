'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth';
import type { LoginRequest, RegisterRequest } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { AxiosError } from 'axios';

interface ApiError {
  detail?: string;
  message?: string;
}

export function useLogin() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: ({ data }) => {
      login(data.user, data.tokens.access_token, data.tokens.refresh_token);
      toast({ title: 'Успешный вход' });
      router.push('/dashboard');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast({ 
        title: 'Ошибка входа', 
        description: error.response?.data?.detail || 'Неверный email или пароль',
        variant: 'destructive' 
      });
    },
  });
}

export function useRegister() {
  const router = useRouter();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: () => {
      toast({ title: 'Регистрация успешна', description: 'Проверьте email для подтверждения' });
      router.push('/login?registered=true');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast({ 
        title: 'Ошибка регистрации', 
        description: error.response?.data?.detail || 'Не удалось зарегистрироваться',
        variant: 'destructive' 
      });
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (allDevices = false) => authApi.logout(allDevices),
    onSettled: () => {
      logout();
      toast({ title: 'Вы вышли из системы' });
      router.push('/login');
    },
  });
}

export function useCurrentUser() {
  const { isAuthenticated, setUser } = useAuthStore();
  
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data } = await authApi.me();
      setUser(data);
      return data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 минут
  });
}

export function useForgotPassword() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: () => {
      toast({ 
        title: 'Email отправлен', 
        description: 'Проверьте почту для сброса пароля' 
      });
    },
    onError: () => {
      toast({ 
        title: 'Ошибка', 
        description: 'Не удалось отправить email',
        variant: 'destructive' 
      });
    },
  });
}

export function useResetPassword() {
  const router = useRouter();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) => 
      authApi.resetPassword(token, password),
    onSuccess: () => {
      toast({ title: 'Пароль изменён' });
      router.push('/login');
    },
    onError: () => {
      toast({ 
        title: 'Ошибка', 
        description: 'Не удалось сбросить пароль',
        variant: 'destructive' 
      });
    },
  });
}

export function useVerifyEmail() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (token: string) => authApi.verifyEmail(token),
    onSuccess: () => {
      toast({ title: 'Email подтверждён' });
    },
    onError: () => {
      toast({ 
        title: 'Ошибка', 
        description: 'Не удалось подтвердить email',
        variant: 'destructive' 
      });
    },
  });
}
