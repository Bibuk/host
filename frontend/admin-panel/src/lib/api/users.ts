import { apiClient } from './client';
import type { 
  User, 
  UserWithRoles, 
  UserCreate, 
  UserUpdate, 
  UserUpdateAdmin,
  PaginatedResponse,
  MessageResponse,
  PasswordChange,
  UserStatus 
} from '@/types/api';

interface ListUsersParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: UserStatus;
}

export const usersApi = {
  list: (params: ListUsersParams = {}) =>
    apiClient.get<PaginatedResponse<User>>('/users', { params }),
  
  get: (id: string) =>
    apiClient.get<UserWithRoles>(`/users/${id}`),
  
  create: (data: UserCreate) =>
    apiClient.post<User>('/users', data),
  
  update: (id: string, data: UserUpdateAdmin) =>
    apiClient.patch<User>(`/users/${id}`, data),
  
  delete: (id: string, hardDelete = false) =>
    apiClient.delete<MessageResponse>(`/users/${id}`, { 
      params: { hard_delete: hardDelete } 
    }),
  
  // Current user endpoints
  updateMe: (data: UserUpdate) =>
    apiClient.patch<User>('/users/me', data),
  
  changePassword: (data: PasswordChange) =>
    apiClient.post<MessageResponse>('/users/me/password', data),
};
