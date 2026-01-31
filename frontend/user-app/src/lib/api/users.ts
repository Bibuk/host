import { apiClient } from './client';
import type { 
  User, 
  UserWithRoles, 
  UserUpdate,
  MessageResponse,
  PasswordChange 
} from '@/types/api';

export const usersApi = {
  // Current user endpoints
  me: () =>
    apiClient.get<UserWithRoles>('/users/me'),
  
  updateMe: (data: UserUpdate) =>
    apiClient.patch<User>('/users/me', data),
  
  changePassword: (data: PasswordChange) =>
    apiClient.post<MessageResponse>('/users/me/password', data),
};
