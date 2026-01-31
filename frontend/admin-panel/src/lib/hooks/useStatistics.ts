'use client';

import { useQuery } from '@tanstack/react-query';
import { statisticsApi } from '@/lib/api/statistics';

export function useStatistics() {
  return useQuery({
    queryKey: ['statistics', 'dashboard'],
    queryFn: () => statisticsApi.getDashboard().then((res) => res.data),
    staleTime: 30 * 1000, // 30 seconds - refresh statistics more often
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
}
