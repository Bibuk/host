'use client';

import { Bell, CheckCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Пример данных уведомлений
const notifications = [
  {
    id: '1',
    title: 'Добро пожаловать!',
    message: 'Спасибо за регистрацию в нашей системе.',
    type: 'system',
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Вход в аккаунт',
    message: 'Обнаружен вход с нового устройства.',
    type: 'security',
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function NotificationsPage() {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Уведомления</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 
              ? `У вас ${unreadCount} непрочитанных уведомлений`
              : 'Все уведомления прочитаны'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline">
            <CheckCheck className="mr-2 h-4 w-4" />
            Прочитать все
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Последние уведомления
          </CardTitle>
          <CardDescription>
            Нажмите на уведомление для просмотра деталей
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Нет уведомлений</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`flex items-start gap-4 p-3 rounded-lg cursor-pointer transition-colors ${
                      notification.read
                        ? 'hover:bg-muted/50'
                        : 'bg-primary/5 hover:bg-primary/10'
                    }`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full mt-2 ${
                        notification.read ? 'bg-transparent' : 'bg-primary'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{notification.title}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <span
                        className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
                          notification.type === 'security'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                        }`}
                      >
                        {notification.type === 'security' ? 'Безопасность' : 'Система'}
                      </span>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
