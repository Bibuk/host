'use client';

import { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  AlertCircle, 
  Info, 
  Shield, 
  Megaphone,
  Filter,
  RefreshCw
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useDeleteAllRead,
} from '@/lib/hooks/useNotifications';
import { NotificationType, NotificationPriority, type Notification } from '@/types/api';

const getTypeInfo = (type: NotificationType) => {
  switch (type) {
    case NotificationType.SECURITY:
      return { 
        label: 'Безопасность', 
        icon: Shield, 
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' 
      };
    case NotificationType.PERSONAL:
      return { 
        label: 'Личное', 
        icon: Info, 
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
      };
    case NotificationType.BROADCAST:
      return { 
        label: 'Объявление', 
        icon: Megaphone, 
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' 
      };
    case NotificationType.SYSTEM:
    default:
      return { 
        label: 'Система', 
        icon: Info, 
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
      };
  }
};

const getPriorityBadge = (priority: NotificationPriority) => {
  switch (priority) {
    case NotificationPriority.CRITICAL:
      return <Badge variant="destructive">Критично</Badge>;
    case NotificationPriority.HIGH:
      return <Badge variant="warning">Важно</Badge>;
    default:
      return null;
  }
};

function NotificationItem({ 
  notification, 
  onMarkRead, 
  onDelete,
  isMarking,
  isDeleting,
}: { 
  notification: Notification;
  onMarkRead: () => void;
  onDelete: () => void;
  isMarking: boolean;
  isDeleting: boolean;
}) {
  const typeInfo = getTypeInfo(notification.type);
  const TypeIcon = typeInfo.icon;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Только что';
    if (hours < 24) return `${hours} ч. назад`;
    if (days < 7) return `${days} дн. назад`;
    
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${
        notification.is_read
          ? 'hover:bg-muted/50'
          : 'bg-primary/5 hover:bg-primary/10'
      }`}
    >
      <div className="flex-shrink-0 mt-1">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
          notification.is_read ? 'bg-muted' : 'bg-primary/10'
        }`}>
          <TypeIcon className={`h-5 w-5 ${
            notification.is_read ? 'text-muted-foreground' : 'text-primary'
          }`} />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className={`font-medium ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                {notification.title}
              </p>
              {!notification.is_read && (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
              {getPriorityBadge(notification.priority)}
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {notification.message}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(notification.created_at)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {!notification.is_read && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8"
                onClick={onMarkRead}
                disabled={isMarking}
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(1);
  
  const { data, isLoading, refetch, isRefetching } = useNotifications({
    page,
    page_size: 20,
    is_read: activeTab === 'unread' ? false : undefined,
  });
  
  const { mutate: markAsRead, isPending: isMarkingRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAllRead } = useMarkAllAsRead();
  const { mutate: deleteNotification, isPending: isDeleting } = useDeleteNotification();
  const { mutate: deleteAllRead, isPending: isDeletingAll } = useDeleteAllRead();

  const notifications = data?.items || [];
  const totalPages = data?.pages || 1;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = (id: string) => {
    markAsRead(id);
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Уведомления</h1>
          <p className="text-muted-foreground">
            {isLoading 
              ? 'Загрузка...'
              : data?.total 
                ? `Всего ${data.total} уведомлений` 
                : 'Нет уведомлений'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
          {unreadCount > 0 && (
            <Button 
              variant="outline"
              onClick={() => markAllAsRead()}
              disabled={isMarkingAllRead}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              {isMarkingAllRead ? 'Отмечаем...' : 'Прочитать все'}
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive hover:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Очистить
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить прочитанные уведомления?</AlertDialogTitle>
                <AlertDialogDescription>
                  Это действие нельзя отменить. Все прочитанные уведомления будут удалены навсегда.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteAllRead()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeletingAll ? 'Удаление...' : 'Удалить'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'unread')}>
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                <Bell className="h-4 w-4" />
                Все
              </TabsTrigger>
              <TabsTrigger value="unread" className="gap-2">
                <AlertCircle className="h-4 w-4" />
                Непрочитанные
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <NotificationSkeleton key={i} />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {activeTab === 'unread' ? 'Нет непрочитанных уведомлений' : 'Нет уведомлений'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTab === 'unread' 
                  ? 'Все уведомления прочитаны' 
                  : 'Когда появятся новые уведомления, вы увидите их здесь'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <NotificationItem
                    notification={notification}
                    onMarkRead={() => handleMarkRead(notification.id)}
                    onDelete={() => handleDelete(notification.id)}
                    isMarking={isMarkingRead}
                    isDeleting={isDeleting}
                  />
                  {index < notifications.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Назад
              </Button>
              <span className="text-sm text-muted-foreground">
                Страница {page} из {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Далее
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
