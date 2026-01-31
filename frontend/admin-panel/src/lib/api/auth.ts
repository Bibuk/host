import { apiClient } from './client';
import type { LoginRequest, LoginResponse, RegisterRequest, User, UserWithRoles } from '@/types/api';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', data),
  
  register: (data: RegisterRequest) =>
    apiClient.post<User>('/auth/register', data),
  
  logout: (allDevices = false) =>
    apiClient.post('/auth/logout', { all_devices: allDevices }),
  
  refresh: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refresh_token: refreshToken }),
  
  me: () =>
    apiClient.get<UserWithRoles>('/users/me'),
  
  verifyEmail: (token: string) =>
    apiClient.post('/auth/verify-email', { token }),
  
  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, newPassword: string) =>
    apiClient.post('/auth/reset-password', { token, new_password: newPassword }),
};
