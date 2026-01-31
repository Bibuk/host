'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Calendar, Shield, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { useUser } from '@/lib/hooks/useUsers';
import { formatDateTime, getFullName } from '@/lib/utils';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { data: user, isLoading } = useUser(userId);

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
    </div>
  );
}
