'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useUsers, useDeleteUser } from '@/lib/hooks/useUsers';
import { formatDate, getFullName } from '@/lib/utils';
import type { User } from '@/types/api';

export default function UsersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const { data, isLoading, error } = useUsers({
    page,
    pageSize: 20,
    search: search || undefined,
  });

  const { mutate: handleDelete, isPending: isDeleting } = useDeleteUser();

  const confirmDelete = () => {
    if (deleteUser) {
      handleDelete({ id: deleteUser.id }, {
        onSuccess: () => setDeleteUser(null),
      });
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Пользователи</h1>
          <p className="text-muted-foreground">
            Управление пользователями системы
          </p>
        </div>
        <Button onClick={() => router.push('/users/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по email, имени..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data?.items.length === 0 ? (
            <EmptyState
              title="Пользователи не найдены"
              description="Попробуйте изменить параметры поиска или добавьте нового пользователя"
              action={{
                label: 'Добавить пользователя',
                onClick: () => router.push('/users/new'),
              }}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Создан</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} size="sm" />
                          <div>
                            <div className="font-medium">
                              {getFullName(user.first_name, user.last_name, user.email)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={user.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/users/${user.id}`)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Просмотр
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/users/${user.id}/edit`)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteUser(user)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data && data.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Показано {data.items.length} из {data.total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Назад
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= data.pages}
                    >
                      Вперёд
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
        title="Удалить пользователя?"
        description={`Вы уверены, что хотите удалить пользователя ${deleteUser?.email}? Это действие нельзя отменить.`}
        onConfirm={confirmDelete}
        confirmLabel="Удалить"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
