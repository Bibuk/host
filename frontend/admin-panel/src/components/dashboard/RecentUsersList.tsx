'use client';

import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import type { RecentUser } from '@/types/api';

interface RecentUsersListProps {
  users: RecentUser[];
  isLoading?: boolean;
}

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

const getStatusBadgeVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'secondary';
    case 'suspended':
    case 'locked':
      return 'destructive';
    case 'pending_verification':
      return 'warning';
    default:
      return 'outline';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active':
      return 'Активен';
    case 'inactive':
      return 'Неактивен';
    case 'suspended':
      return 'Приостановлен';
    case 'locked':
      return 'Заблокирован';
    case 'pending_verification':
      return 'Ожидает';
    default:
      return status;
  }
};

export function RecentUsersList({ users, isLoading }: RecentUsersListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-36 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Недавние регистрации</CardTitle>
          <CardDescription>Последние зарегистрированные пользователи</CardDescription>
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
        <CardTitle className="text-lg">Недавние регистрации</CardTitle>
        <CardDescription>Последние зарегистрированные пользователи</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3">
            <UserAvatar
              name={user.first_name || user.username || user.email}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.first_name && user.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user.username || user.email}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(user.created_at), {
                  addSuffix: true,
                  locale: ru,
                })}
              </p>
            </div>
            <Badge variant={getStatusBadgeVariant(user.status)}>
              {getStatusLabel(user.status)}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
