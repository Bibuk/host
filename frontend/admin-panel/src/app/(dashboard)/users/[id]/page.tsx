'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  CheckCircle, 
  Globe, 
  Clock,
  Trash2,
  UserCheck,
  UserX,
  ShieldAlert,
  MoreVertical,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useUser, useUpdateUser, useDeleteUser } from '@/lib/hooks/useUsers';
import { formatDateTime, getFullName } from '@/lib/utils';
import { UserStatus } from '@/types/api';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { data: user, isLoading } = useUser(userId);
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();
  
  const [statusAction, setStatusAction] = useState<UserStatus | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const confirmStatusChange = () => {
    if (statusAction && user) {
      updateUser(
        { id: user.id, data: { status: statusAction } },
        { onSuccess: () => setStatusAction(null) }
      );
    }
  };

  const confirmDelete = () => {
    if (user) {
      deleteUser(
        { id: user.id },
        { 
          onSuccess: () => {
            setShowDeleteDialog(false);
            router.push('/users');
          }
        }
      );
    }
  };

  const getStatusActionLabel = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'Активировать';
      case UserStatus.SUSPENDED:
        return 'Заблокировать';
      case UserStatus.LOCKED:
        return 'Заморозить';
      default:
        return 'Изменить статус';
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Пользователь не найден</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Назад
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {getFullName(user.first_name, user.last_name, user.email)}
            </h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {user.status !== UserStatus.ACTIVE && (
              <DropdownMenuItem onClick={() => setStatusAction(UserStatus.ACTIVE)}>
                <UserCheck className="mr-2 h-4 w-4 text-green-600" />
                Активировать
              </DropdownMenuItem>
            )}
            {user.status !== UserStatus.SUSPENDED && (
              <DropdownMenuItem onClick={() => setStatusAction(UserStatus.SUSPENDED)}>
                <ShieldAlert className="mr-2 h-4 w-4 text-orange-600" />
                Заблокировать
              </DropdownMenuItem>
            )}
            {user.status !== UserStatus.LOCKED && (
              <DropdownMenuItem onClick={() => setStatusAction(UserStatus.LOCKED)}>
                <UserX className="mr-2 h-4 w-4 text-red-600" />
                Заморозить
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* User Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Информация о пользователе</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <UserAvatar user={user} size="lg" />
              <div>
                <h3 className="text-lg font-semibold">
                  {getFullName(user.first_name, user.last_name)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  @{user.username || 'не указан'}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                {user.email_verified && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Телефон</p>
                  <p className="font-medium">{user.phone || 'Не указан'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Создан</p>
                  <p className="font-medium">{formatDateTime(user.created_at)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Последний вход</p>
                  <p className="font-medium">
                    {user.last_login_at
                      ? formatDateTime(user.last_login_at)
                      : 'Никогда'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status & Roles Card */}
        <Card>
          <CardHeader>
            <CardTitle>Статус и роли</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Статус</p>
              <StatusBadge status={user.status} />
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-2">Роли</p>
              <div className="flex flex-wrap gap-2">
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((role) => (
                    <Badge key={role.id} variant="secondary">
                      <Shield className="mr-1 h-3 w-3" />
                      {role.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Роли не назначены
                  </span>
                )}
              </div>
            </div>

            <Separator />

            <div className="pt-2">
              <Button
                className="w-full"
                onClick={() => router.push(`/users/${user.id}/edit`)}
              >
                Редактировать
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Дополнительная информация</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Локаль</p>
                <p className="font-medium">{user.locale || 'ru'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Часовой пояс</p>
                <p className="font-medium">{user.timezone || 'UTC'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Обновлён</p>
                <p className="font-medium">{formatDateTime(user.updated_at)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email подтверждён</p>
                <p className="font-medium flex items-center gap-1">
                  {user.email_verified ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Да
                    </>
                  ) : (
                    'Нет'
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status change confirmation dialog */}
      <ConfirmDialog
        open={!!statusAction}
        onOpenChange={(open) => !open && setStatusAction(null)}
        title="Изменить статус пользователя?"
        description={`Вы уверены, что хотите ${getStatusActionLabel(statusAction || UserStatus.ACTIVE).toLowerCase()} пользователя ${user.email}?`}
        onConfirm={confirmStatusChange}
        confirmLabel={statusAction ? getStatusActionLabel(statusAction) : 'Подтвердить'}
        variant={statusAction === UserStatus.ACTIVE ? 'default' : 'destructive'}
        isLoading={isUpdating}
      />

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Удалить пользователя?"
        description={`Вы уверены, что хотите удалить пользователя ${user.email}? Это действие нельзя отменить.`}
        onConfirm={confirmDelete}
        confirmLabel="Удалить"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
