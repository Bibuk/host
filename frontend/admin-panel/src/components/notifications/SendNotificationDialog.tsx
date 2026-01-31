'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, Search, X, User, Check } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { useSendNotification } from '@/lib/hooks/useNotifications';
import { useUsers } from '@/lib/hooks/useUsers';
import { NotificationType, NotificationPriority } from '@/types/api';

const formSchema = z.object({
  title: z.string().min(1, 'Введите заголовок').max(200),
  message: z.string().min(1, 'Введите сообщение'),
  type: z.nativeEnum(NotificationType),
  priority: z.nativeEnum(NotificationPriority),
  action_url: z.string().url('Некорректный URL').optional().or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;

interface SendNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedUserIds?: string[];
}

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

export function SendNotificationDialog({
  open,
  onOpenChange,
  preselectedUserIds = [],
}: SendNotificationDialogProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(preselectedUserIds);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);

  const sendNotification = useSendNotification();
  const { data: usersData, isLoading: usersLoading } = useUsers({
    page: 1,
    pageSize: 100,
    search: searchQuery || undefined,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      message: '',
      type: NotificationType.PERSONAL,
      priority: NotificationPriority.NORMAL,
      action_url: '',
    },
  });

  const type = watch('type');
  const priority = watch('priority');

  useEffect(() => {
    if (preselectedUserIds.length > 0) {
      setSelectedUserIds(preselectedUserIds);
    }
  }, [preselectedUserIds]);

  const onSubmit = async (data: FormData) => {
    if (selectedUserIds.length === 0) {
      return;
    }

    await sendNotification.mutateAsync({
      user_ids: selectedUserIds,
      title: data.title,
      message: data.message,
      type: data.type,
      priority: data.priority,
      action_url: data.action_url || null,
    });

    reset();
    setSelectedUserIds([]);
    onOpenChange(false);
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const removeUser = (userId: string) => {
    setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
  };

  const selectedUsers = usersData?.items.filter((u) => selectedUserIds.includes(u.id)) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Отправить уведомление
          </DialogTitle>
          <DialogDescription>
            Отправьте уведомление выбранным пользователям
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Selected Users */}
          <div className="space-y-2">
            <Label>Получатели *</Label>
            <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px]">
              {selectedUsers.map((user) => (
                <Badge key={user.id} variant="secondary" className="gap-1">
                  <User className="h-3 w-3" />
                  {user.email}
                  <button
                    type="button"
                    onClick={() => removeUser(user.id)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {selectedUserIds.length === 0 && (
                <span className="text-sm text-muted-foreground">
                  Выберите пользователей
                </span>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowUserSearch(!showUserSearch)}
            >
              <Search className="mr-2 h-4 w-4" />
              {showUserSearch ? 'Скрыть поиск' : 'Добавить получателей'}
            </Button>
          </div>

          {/* User Search */}
          {showUserSearch && (
            <div className="space-y-2 p-3 border rounded-md bg-muted/50">
              <Input
                placeholder="Поиск по email, имени..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {usersLoading ? (
                  <>
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </>
                ) : usersData?.items && usersData.items.length > 0 ? (
                  usersData.items.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-accent ${
                        selectedUserIds.includes(user.id) ? 'bg-accent' : ''
                      }`}
                      onClick={() => toggleUser(user.id)}
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">{user.email}</div>
                          {(user.first_name || user.last_name) && (
                            <div className="text-xs text-muted-foreground">
                              {[user.first_name, user.last_name].filter(Boolean).join(' ')}
                            </div>
                          )}
                        </div>
                      </div>
                      {selectedUserIds.includes(user.id) && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Пользователи не найдены
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Заголовок *</Label>
            <Input
              id="title"
              placeholder="Важное уведомление"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Сообщение *</Label>
            <textarea
              id="message"
              placeholder="Текст уведомления..."
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('message')}
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message.message}</p>
            )}
          </div>

          {/* Type & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Тип</Label>
              <Select
                value={type}
                onValueChange={(v) => setValue('type', v as NotificationType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(NotificationType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {typeLabels[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Приоритет</Label>
              <Select
                value={priority}
                onValueChange={(v) => setValue('priority', v as NotificationPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(NotificationPriority).map((p) => (
                    <SelectItem key={p} value={p}>
                      {priorityLabels[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action URL */}
          <div className="space-y-2">
            <Label htmlFor="action_url">Ссылка (опционально)</Label>
            <Input
              id="action_url"
              placeholder="https://example.com/action"
              {...register('action_url')}
            />
            {errors.action_url && (
              <p className="text-sm text-destructive">{errors.action_url.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || sendNotification.isPending || selectedUserIds.length === 0}
            >
              {sendNotification.isPending ? 'Отправка...' : 'Отправить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
