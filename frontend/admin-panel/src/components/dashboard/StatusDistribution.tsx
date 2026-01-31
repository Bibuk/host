'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserStatusStats } from '@/types/api';

interface StatusDistributionProps {
  data: UserStatusStats;
  isLoading?: boolean;
}

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

const STATUS_COLORS = {
  active: '#22c55e',       // green
  inactive: '#9ca3af',     // gray
  suspended: '#f97316',    // orange
  locked: '#ef4444',       // red
  pending_verification: '#3b82f6', // blue
};

const STATUS_LABELS = {
  active: 'Активные',
  inactive: 'Неактивные',
  suspended: 'Приостановлены',
  locked: 'Заблокированы',
  pending_verification: 'Ожидают верификации',
};

export function StatusDistribution({ data, isLoading }: StatusDistributionProps) {
  const chartData = useMemo((): ChartDataItem[] => {
    return [
      { name: STATUS_LABELS.active, value: data.active, color: STATUS_COLORS.active },
      { name: STATUS_LABELS.inactive, value: data.inactive, color: STATUS_COLORS.inactive },
      { name: STATUS_LABELS.suspended, value: data.suspended, color: STATUS_COLORS.suspended },
      { name: STATUS_LABELS.locked, value: data.locked, color: STATUS_COLORS.locked },
      { name: STATUS_LABELS.pending_verification, value: data.pending_verification, color: STATUS_COLORS.pending_verification },
    ].filter((item) => item.value > 0);
  }, [data]);

  const total = useMemo(() => {
    return chartData.reduce((acc: number, item: ChartDataItem) => acc + item.value, 0);
  }, [chartData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-36 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Статусы пользователей</CardTitle>
          <CardDescription>Распределение по статусам</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground">Нет данных</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Статусы пользователей</CardTitle>
        <CardDescription>Распределение по статусам</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }: { name: string; percent: number }) => 
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
              labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
            >
              {chartData.map((entry: ChartDataItem, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`${value} пользователей`, '']}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
