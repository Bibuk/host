'use client';

import { Smartphone, Monitor, Globe, Trash2, LogOut, Clock, Shield, MapPin, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useSessions, useRevokeSession, useRevokeAllSessions } from '@/lib/hooks/useSessions';
import { DeviceType } from '@/types/api';

export default function SessionsPage() {
  const { data: sessions, isLoading } = useSessions();
  const { mutate: revokeSession, isPending: isRevoking } = useRevokeSession();
  const { mutate: revokeAll, isPending: isRevokingAll } = useRevokeAllSessions();

  const getDeviceIcon = (userAgent?: string | null, deviceType?: DeviceType) => {
    if (deviceType === DeviceType.MOBILE) return Smartphone;
    if (deviceType === DeviceType.DESKTOP) return Monitor;
    
    if (!userAgent) return Monitor;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return Smartphone;
    }
    return Monitor;
  };

  const getBrowserName = (userAgent?: string | null) => {
    if (!userAgent) return 'Неизвестный браузер';
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('chrome') && !ua.includes('edge')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    if (ua.includes('opera')) return 'Opera';
    
    return 'Браузер';
  };

  const getOSName = (userAgent?: string | null) => {
    if (!userAgent) return '';
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
    
    return '';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 5) return 'Только что';
    if (minutes < 60) return `${minutes} мин. назад`;
    if (hours < 24) return `${hours} ч. назад`;
    if (days < 7) return `${days} дн. назад`;
    
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentSession = sessions?.find(s => s.is_current);
  const otherSessions = sessions?.filter(s => !s.is_current) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Сессии</h1>
          <p className="text-muted-foreground">
            {sessions?.length 
              ? `${sessions.length} активных ${sessions.length === 1 ? 'сессия' : 'сессий'}`
              : 'Управляйте активными сессиями'}
          </p>
        </div>
        {otherSessions.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Завершить все другие
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Завершить все сессии?</AlertDialogTitle>
                <AlertDialogDescription>
                  Вы будете разлогинены на всех устройствах, кроме текущего. 
                  Это действие нельзя отменить.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => revokeAll()}
                  disabled={isRevokingAll}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isRevokingAll ? 'Завершение...' : 'Завершить все'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Current Session */}
      {currentSession && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Текущая сессия
              </CardTitle>
              <Badge variant="success">Активна</Badge>
            </div>
            <CardDescription>
              Устройство, с которого вы сейчас работаете
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              {(() => {
                const Icon = getDeviceIcon(currentSession.user_agent, currentSession.device_type);
                return (
                  <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                );
              })()}
              <div className="flex-1 space-y-1">
                <p className="font-semibold text-lg">
                  {currentSession.device_name || `${getBrowserName(currentSession.user_agent)} на ${getOSName(currentSession.user_agent)}`}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {currentSession.ip_address || 'Неизвестный IP'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Вход: {formatFullDate(currentSession.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Другие устройства
          </CardTitle>
          <CardDescription>
            Устройства, на которых также выполнен вход в ваш аккаунт
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              ))}
            </div>
          ) : otherSessions.length > 0 ? (
            <div className="space-y-3">
              {otherSessions.map((session, index) => {
                const Icon = getDeviceIcon(session.user_agent, session.device_type);
                const browserName = getBrowserName(session.user_agent);
                const osName = getOSName(session.user_agent);

                return (
                  <div key={session.id}>
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {session.device_name || `${browserName}${osName ? ` на ${osName}` : ''}`}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {session.ip_address || 'Неизвестный IP'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(session.last_activity_at || session.created_at)}
                          </span>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Завершить сессию?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Вы будете разлогинены на устройстве "{session.device_name || browserName}". 
                              Для повторного входа потребуется ввести пароль.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => revokeSession(session.id)}
                              disabled={isRevoking}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Завершить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    {index < otherSessions.length - 1 && <Separator className="my-2" />}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="h-12 w-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-muted-foreground">Нет других активных сессий</p>
              <p className="text-sm text-muted-foreground mt-1">
                Вы вошли только с текущего устройства
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Безопасность сессий</AlertTitle>
        <AlertDescription>
          <p className="mt-2">
            Если вы заметили подозрительную активность или устройство, которое вам незнакомо:
          </p>
          <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
            <li>Немедленно завершите эту сессию</li>
            <li>Смените пароль в настройках безопасности</li>
            <li>Проверьте историю входов в аккаунт</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  );
}
