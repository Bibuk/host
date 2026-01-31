'use client';

import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  UserCheck,
  UserPlus,
  Clock,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardStatistics } from '@/types/api';

interface QuickStatsProps {
  stats: DashboardStatistics | undefined;
  isLoading?: boolean;
}

interface StatItemProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  trend?: number;
  trendLabel?: string;
  iconColor?: string;
  isLoading?: boolean;
}

function StatItem({
  title,
  value,
  icon,
  trend,
  trendLabel,
  iconColor = 'text-primary',
  isLoading,
}: StatItemProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn('h-5 w-5', iconColor)}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 text-xs mt-1">
            {trend >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span
              className={cn(
                trend >= 0 ? 'text-green-600' : 'text-red-600',
                'font-medium'
              )}
            >
              {trend >= 0 ? '+' : ''}
              {trend}%
            </span>
            {trendLabel && (
              <span className="text-muted-foreground">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function QuickStats({ stats, isLoading }: QuickStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatItem
        title="Всего пользователей"
        value={stats?.total_users ?? 0}
        icon={<Users className="h-5 w-5" />}
        iconColor="text-blue-500"
        isLoading={isLoading}
      />
      <StatItem
        title="Активных"
        value={stats?.active_users ?? 0}
        icon={<UserCheck className="h-5 w-5" />}
        iconColor="text-green-500"
        isLoading={isLoading}
      />
      <StatItem
        title="Новых за неделю"
        value={stats?.new_users_week ?? 0}
        icon={<UserPlus className="h-5 w-5" />}
        trend={stats?.weekly_trend}
        trendLabel="за неделю"
        iconColor="text-indigo-500"
        isLoading={isLoading}
      />
      <StatItem
        title="Новых за месяц"
        value={stats?.new_users_month ?? 0}
        icon={<Clock className="h-5 w-5" />}
        trend={stats?.monthly_trend}
        trendLabel="за месяц"
        iconColor="text-purple-500"
        isLoading={isLoading}
      />
      <StatItem
        title="Заблокировано"
        value={stats?.blocked_users ?? 0}
        icon={<ShieldAlert className="h-5 w-5" />}
        iconColor="text-red-500"
        isLoading={isLoading}
      />
    </div>
  );
}
