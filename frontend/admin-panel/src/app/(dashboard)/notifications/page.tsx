'use client';

import { useState } from 'react';
import {
  Bell,
  Send,
  Megaphone,
  Trash2,
  Filter,
  Plus,
  RefreshCw,
  Users,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

import { 
  useNotifications, 
  useNotificationStats,
  useDeleteNotification,
  useDeleteNotifications,
} from '@/lib/hooks/useNotifications';
import { NotificationType, NotificationPriority } from '@/types/api';
import { SendNotificationDialog } from '@/components/notifications/SendNotificationDialog';
import { BroadcastNotificationDialog } from '@/components/notifications/BroadcastNotificationDialog';

const typeLabels: Record<NotificationType, string> = {
  [NotificationType.SYSTEM]: 'Системное',
  [NotificationType.SECURITY]: 'Безопасность',
  [NotificationType.PERSONAL]: 'Личное',
  [NotificationType.BROADCAST]: 'Рассылка',
};

const priorityLabels: Record<NotificationPriority, string> = {
  [NotificationPriority.LOW]: 'Низкий',
  [NotificationPriority.NORMAL]: 'Обычный',
  [NotificationPriority.HIGH]: 'Высокий',
  [NotificationPriority.CRITICAL]: 'Критичный',
};

const priorityVariants: Record<NotificationPriority, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [NotificationPriority.LOW]: 'secondary',
  [NotificationPriority.NORMAL]: 'default',
  [NotificationPriority.HIGH]: 'outline',
  [NotificationPriority.CRITICAL]: 'destructive',
};

const typeIcons: Record<NotificationType, typeof Bell> = {
  [NotificationType.SYSTEM]: Info,
  [NotificationType.SECURITY]: AlertCircle,
  [NotificationType.PERSONAL]: Bell,
  [NotificationType.BROADCAST]: Megaphone,
};

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);

  const { data: notifications, isLoading, refetch } = useNotifications({
    page,
    pageSize: 20,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
  });

  const { data: stats, isLoading: statsLoading } = useNotificationStats();
  const deleteNotification = useDeleteNotification();
  const deleteNotifications = useDeleteNotifications();

  const handleDeleteSelected = () => {
    if (selectedIds.length > 0) {
      deleteNotifications.mutate(selectedIds, {
        onSuccess: () => {
          setSelectedIds([]);
          setDeleteDialogOpen(false);
        },
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (notifications?.items) {
      if (selectedIds.length === notifications.items.length) {
        setSelectedIds([]);
      } else {
        setSelectedIds(notifications.items.map((n) => n.id));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Уведомления</h1>
          <p className="text-muted-foreground">
            Управление уведомлениями пользователей
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Обновить
          </Button>
          <Button variant="outline" onClick={() => setSendDialogOpen(true)}>
            <Send className="mr-2 h-4 w-4" />
            Отправить
          </Button>
          <Button onClick={() => setBroadcastDialogOpen(true)}>
            <Megaphone className="mr-2 h-4 w-4" />
            Рассылка
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Непрочитанных</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold text-orange-600">
                {stats?.unread_count || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Рассылок</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.by_type?.broadcast || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Критичных</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {stats?.by_priority?.critical || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="w-48">
              <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as NotificationType | 'all')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  {Object.values(NotificationType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {typeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <Select
                value={priorityFilter}
                onValueChange={(v) => setPriorityFilter(v as NotificationPriority | 'all')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Приоритет" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все приоритеты</SelectItem>
                  {Object.values(NotificationPriority).map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priorityLabels[priority]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить ({selectedIds.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>История уведомлений</CardTitle>
          <CardDescription>
            Все отправленные уведомления пользователям
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : notifications?.items && notifications.items.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === notifications.items.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Заголовок</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Приоритет</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.items.map((notification) => {
                    const TypeIcon = typeIcons[notification.type];
                    return (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(notification.id)}
                            onChange={() => toggleSelect(notification.id)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TypeIcon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{notification.title}</div>
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {notification.message}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {typeLabels[notification.type]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={priorityVariants[notification.priority]}>
                            {priorityLabels[notification.priority]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {notification.read_at ? (
                            <Badge variant="secondary">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Прочитано
                            </Badge>
                          ) : (
                            <Badge variant="outline">Не прочитано</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ru,
                          })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteNotification.mutate(notification.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {notifications.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Назад
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Страница {page} из {notifications.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === notifications.pages}
                    onClick={() => setPage(page + 1)}
                  >
                    Далее
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">Нет уведомлений</p>
              <p className="text-sm">Отправьте первое уведомление пользователям</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить уведомления?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы собираетесь удалить {selectedIds.length} уведомлений. Это действие
              нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Notification Dialog */}
      <SendNotificationDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
      />

      {/* Broadcast Notification Dialog */}
      <BroadcastNotificationDialog
        open={broadcastDialogOpen}
        onOpenChange={setBroadcastDialogOpen}
      />
    </div>
  );
}
