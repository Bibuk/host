'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';
import { getFullName } from '@/lib/utils';
import Link from 'next/link';
import { User, Settings, Bell, Shield, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const fullName = getFullName(user?.first_name, user?.last_name);

  const quickActions = [
    {
      title: 'Профиль',
      description: 'Редактировать личные данные',
      href: '/profile',
      icon: User,
    },
    {
      title: 'Безопасность',
      description: 'Сменить пароль и настройки',
      href: '/settings/security',
      icon: Shield,
    },
    {
      title: 'Уведомления',
      description: 'Просмотреть уведомления',
      href: '/notifications',
      icon: Bell,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Привет, {fullName || 'Пользователь'}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Добро пожаловать в ваш личный кабинет
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card key={action.href} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {action.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  {action.description}
                </p>
                <Link href={action.href}>
                  <Button variant="outline" size="sm" className="w-full">
                    Перейти
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Account status */}
      <Card>
        <CardHeader>
          <CardTitle>Статус аккаунта</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${
                user?.email_verified ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-xs text-muted-foreground">
                  {user?.email_verified ? 'Подтверждён' : 'Требует подтверждения'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium">Статус</p>
                <p className="text-xs text-muted-foreground">
                  Аккаунт активен
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
