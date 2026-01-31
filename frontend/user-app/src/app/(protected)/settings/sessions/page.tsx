'use client';

import { Smartphone, Monitor, Globe, Trash2, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useSessions, useRevokeSession, useRevokeAllSessions } from '@/lib/hooks/useSessions';

export default function SessionsPage() {
  const { data: sessions, isLoading } = useSessions();
  const { mutate: revokeSession, isPending: isRevoking } = useRevokeSession();
  const { mutate: revokeAll, isPending: isRevokingAll } = useRevokeAllSessions();

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return Monitor;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return Smartphone;
    }
    return Monitor;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Сессии</h1>
          <p className="text-muted-foreground">
            Управляйте активными сессиями вашего аккаунта
          </p>
        </div>
        <Button 
          variant="destructive" 
          onClick={() => revokeAll()}
          disabled={isRevokingAll}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isRevokingAll ? 'Завершение...' : 'Завершить все'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Активные устройства
          </CardTitle>
          <CardDescription>
            Все устройства, на которых выполнен вход в ваш аккаунт
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-muted" />
                    <div className="h-3 w-48 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : sessions && sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.map((session, index) => {
                const Icon = getDeviceIcon(session.user_agent);
                const isCurrent = session.is_current;

                return (
                  <div key={session.id}>
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {session.device_name || 'Неизвестное устройство'}
                          </p>
                          {isCurrent && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                              Текущая
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Globe className="h-3 w-3" />
                          <span>{session.ip_address || 'Неизвестный IP'}</span>
                          <span>•</span>
                          <span>Последняя активность: {formatDate(session.last_activity || session.created_at)}</span>
                        </div>
                      </div>
                      {!isCurrent && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => revokeSession(session.id)}
                          disabled={isRevoking}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {index < sessions.length - 1 && <Separator className="my-2" />}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Нет активных сессий</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Безопасность сессий</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Если вы заметили подозрительную активность, рекомендуем завершить все сессии и сменить пароль.
            Вы всегда можете войти заново на своих устройствах.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
