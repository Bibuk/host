'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth';
import { useCurrentUser } from '@/lib/hooks/useAuth';
import { useSessions } from '@/lib/hooks/useSessions';
import { useUnreadCount } from '@/lib/hooks/useNotifications';
import { getFullName } from '@/lib/utils';
import Link from 'next/link';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  ArrowRight, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  Smartphone,
  Clock,
  Calendar,
  Activity
} from 'lucide-react';
import { UserStatus } from '@/types/api';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { isLoading: isLoadingUser } = useCurrentUser();
  const { data: sessions } = useSessions();
  const { data: unreadCount = 0 } = useUnreadCount();
  
  const fullName = getFullName(user?.first_name, user?.last_name);

  // Подсчет заполненности профиля
  const calculateProfileCompletion = () => {
    if (!user) return 0;
    const fields = [
      user.email,
      user.first_name,
      user.last_name,
      user.username,
      user.phone,
      user.avatar_url,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  const profileCompletion = calculateProfileCompletion();

  const getStatusInfo = (status?: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return { label: 'Активен', variant: 'success' as const, icon: CheckCircle2 };
      case UserStatus.PENDING_VERIFICATION:
        return { label: 'Ожидает подтверждения', variant: 'warning' as const, icon: Clock };
      case UserStatus.SUSPENDED:
        return { label: 'Приостановлен', variant: 'destructive' as const, icon: AlertCircle };
      case UserStatus.LOCKED:
        return { label: 'Заблокирован', variant: 'destructive' as const, icon: AlertCircle };
      default:
        return { label: 'Неактивен', variant: 'secondary' as const, icon: AlertCircle };
    }
  };

  const statusInfo = getStatusInfo(user?.status);
  const StatusIcon = statusInfo.icon;

  const quickActions = [
    {
      title: 'Профиль',
      description: 'Редактировать личные данные',
      href: '/profile',
      icon: User,
      badge: profileCompletion < 100 ? `${profileCompletion}%` : null,
    },
    {
      title: 'Безопасность',
      description: 'Сменить пароль и настройки',
      href: '/settings/security',
      icon: Shield,
      badge: null,
    },
    {
      title: 'Уведомления',
      description: 'Просмотреть уведомления',
      href: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? String(unreadCount) : null,
    },
  ];

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'Нет данных';
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoadingUser) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Привет, {fullName || 'Пользователь'}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Добро пожаловать в ваш личный кабинет
          </p>
        </div>
        <Badge variant={statusInfo.variant} className="hidden md:flex gap-1">
          <StatusIcon className="h-3 w-3" />
          {statusInfo.label}
        </Badge>
      </div>

      {/* Alerts */}
      {!user?.email_verified && (
        <Alert variant="warning">
          <Mail className="h-4 w-4" />
          <AlertTitle>Подтвердите email</AlertTitle>
          <AlertDescription>
            Пожалуйста, подтвердите ваш email адрес для полного доступа к функциям системы.
            <Link href="/profile" className="ml-1 underline hover:no-underline">
              Перейти в профиль
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {profileCompletion < 50 && (
        <Alert>
          <User className="h-4 w-4" />
          <AlertTitle>Заполните профиль</AlertTitle>
          <AlertDescription>
            Ваш профиль заполнен на {profileCompletion}%. Добавьте больше информации о себе.
            <Link href="/profile" className="ml-1 underline hover:no-underline">
              Заполнить сейчас
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card key={action.href} className="hover:shadow-md transition-shadow group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {action.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {action.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {action.badge}
                    </Badge>
                  )}
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  {action.description}
                </p>
                <Link href={action.href}>
                  <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    Перейти
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Profile completion */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Профиль</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profileCompletion}%</div>
            <Progress value={profileCompletion} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {profileCompletion === 100 ? 'Профиль заполнен' : 'Заполненность профиля'}
            </p>
          </CardContent>
        </Card>

        {/* Active sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Сессии</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Активных устройств
            </p>
            <Link href="/settings/sessions" className="text-xs text-primary hover:underline">
              Управление сессиями →
            </Link>
          </CardContent>
        </Card>

        {/* Unread notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Уведомления</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Непрочитанных
            </p>
            <Link href="/notifications" className="text-xs text-primary hover:underline">
              Просмотреть все →
            </Link>
          </CardContent>
        </Card>

        {/* Last login */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Последний вход</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {user?.last_login_at 
                ? new Date(user.last_login_at).toLocaleDateString('ru-RU')
                : 'Сейчас'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {user?.last_login_at 
                ? new Date(user.last_login_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                : 'Первый вход'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Account info */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Account status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Статус аккаунта
            </CardTitle>
            <CardDescription>
              Информация о безопасности вашего аккаунта
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${
                  user?.email_verified ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>
              <Badge variant={user?.email_verified ? 'success' : 'warning'}>
                {user?.email_verified ? 'Подтверждён' : 'Не подтверждён'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusIcon className={`h-3 w-3 ${
                  statusInfo.variant === 'success' ? 'text-green-500' : 
                  statusInfo.variant === 'warning' ? 'text-yellow-500' : 'text-red-500'
                }`} />
                <div>
                  <p className="text-sm font-medium">Статус аккаунта</p>
                  <p className="text-xs text-muted-foreground">
                    {statusInfo.label}
                  </p>
                </div>
              </div>
              <Badge variant={statusInfo.variant}>
                {statusInfo.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Account details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Информация об аккаунте
            </CardTitle>
            <CardDescription>
              Основные сведения о вашем аккаунте
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Дата регистрации</p>
              <p className="text-sm font-medium">
                {user?.created_at 
                  ? new Date(user.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Нет данных'}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Часовой пояс</p>
              <p className="text-sm font-medium">{user?.timezone || 'UTC'}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Локаль</p>
              <p className="text-sm font-medium">{user?.locale || 'ru'}</p>
            </div>
            <div className="pt-2">
              <Link href="/settings">
                <Button variant="outline" size="sm" className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Настройки
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
