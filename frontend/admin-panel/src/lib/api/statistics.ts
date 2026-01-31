import { apiClient } from './client';
import type { DashboardStatistics } from '@/types/api';

export const statisticsApi = {
  getDashboard: () =>
    apiClient.get<DashboardStatistics>('/statistics/dashboard'),
};
