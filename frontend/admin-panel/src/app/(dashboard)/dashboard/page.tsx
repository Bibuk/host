'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStatistics } from '@/lib/hooks/useStatistics';
import {
  QuickStats,
  RegistrationChart,
  ActivityChart,
  StatusDistribution,
  RecentUsersList,
} from '@/components/dashboard';

export default function DashboardPage() {
  const { data: stats, isLoading, refetch, isFetching } = useStatistics();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Обзор системы управления пользователями
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {/* Quick Stats */}
      <QuickStats stats={stats} isLoading={isLoading} />

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <RegistrationChart
          data={stats?.registrations_last_30_days || []}
          isLoading={isLoading}
        />
        <ActivityChart
          data={stats?.activity_last_7_days || []}
          isLoading={isLoading}
        />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatusDistribution
          data={stats?.status_stats || {
            active: 0,
            inactive: 0,
            suspended: 0,
            locked: 0,
            pending_verification: 0,
          }}
          isLoading={isLoading}
        />
        <RecentUsersList
          users={stats?.recent_users || []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
