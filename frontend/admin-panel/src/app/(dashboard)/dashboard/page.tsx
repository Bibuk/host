'use client';

import { Users, UserPlus, UserCheck, UserX } from 'lucide-react';
import { StatsCard } from '@/components/shared/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUsers } from '@/lib/hooks/useUsers';
import { UserStatus } from '@/types/api';

export default function DashboardPage() {
  const { data: usersData, isLoading } = useUsers({ pageSize: 1 });

  // Для демо используем примерные данные
  const stats = [
    {
      title: 'Всего пользователей',
      value: usersData?.total || 0,
      icon: Users,
      description: 'Зарегистрировано в системе',
    },
    {
      title: 'Активных',
      value: '—',
      icon: UserCheck,
      description: 'Статус активен',
      trend: { value: 12, isPositive: true },
    },
    {
      title: 'Новых за неделю',
      value: '—',
      icon: UserPlus,
      description: 'Последние 7 дней',
    },
    {
      title: 'Заблокированных',
      value: '—',
      icon: UserX,
      description: 'Требуют внимания',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Обзор системы управления пользователями
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            description={stat.description}
            trend={stat.trend}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Недавние регистрации</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Здесь будут отображаться последние зарегистрированные пользователи
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Активность</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Здесь будет отображаться график активности пользователей
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
