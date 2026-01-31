import { apiClient } from './client';
import type { Session } from '@/types/api';

export const sessionsApi = {
  getSessions: async (): Promise<Session[]> => {
    const response = await apiClient.get<Session[]>('/users/me/sessions');
    return response.data;
  },

  revokeSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/users/me/sessions/${sessionId}`);
  },

  revokeAllSessions: async (): Promise<void> => {
    await apiClient.delete('/users/me/sessions');
  },
};
