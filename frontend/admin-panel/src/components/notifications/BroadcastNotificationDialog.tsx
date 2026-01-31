'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Megaphone, AlertTriangle } from 'lucide-react';

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

import { useBroadcastNotification } from '@/lib/hooks/useNotifications';
import { NotificationPriority } from '@/types/api';

const formSchema = z.object({
  title: z.string().min(1, 'Введите заголовок').max(200),
  message: z.string().min(1, 'Введите сообщение'),
  priority: z.nativeEnum(NotificationPriority),
  action_url: z.string().url('Некорректный URL').optional().or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;

interface BroadcastNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const priorityLabels: Record<NotificationPriority, string> = {
  [NotificationPriority.LOW]: 'Низкий',
  [NotificationPriority.NORMAL]: 'Обычный',
  [NotificationPriority.HIGH]: 'Высокий',
  [NotificationPriority.CRITICAL]: 'Критичный',
};

export function BroadcastNotificationDialog({
  open,
  onOpenChange,
}: BroadcastNotificationDialogProps) {
  const broadcastNotification = useBroadcastNotification();

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
      priority: NotificationPriority.NORMAL,
      action_url: '',
    },
  });

  const priority = watch('priority');

  const onSubmit = async (data: FormData) => {
    await broadcastNotification.mutateAsync({
      title: data.title,
      message: data.message,
      priority: data.priority,
      action_url: data.action_url || null,
    });

    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Массовая рассылка
          </DialogTitle>
          <DialogDescription>
            Отправьте уведомление всем активным пользователям
          </DialogDescription>
        </DialogHeader>

        {/* Warning */}
        <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
          <div className="text-sm text-orange-800 dark:text-orange-200">
            <p className="font-medium">Внимание!</p>
            <p>
              Это уведомление будет отправлено всем активным пользователям системы.
              Убедитесь в корректности информации перед отправкой.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="broadcast-title">Заголовок *</Label>
            <Input
              id="broadcast-title"
              placeholder="Важное объявление"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="broadcast-message">Сообщение *</Label>
            <textarea
              id="broadcast-message"
              placeholder="Текст уведомления для всех пользователей..."
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('message')}
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message.message}</p>
            )}
          </div>

          {/* Priority */}
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
            <p className="text-xs text-muted-foreground">
              Критичный приоритет используйте только для срочных сообщений
            </p>
          </div>

          {/* Action URL */}
          <div className="space-y-2">
            <Label htmlFor="broadcast-action_url">Ссылка (опционально)</Label>
            <Input
              id="broadcast-action_url"
              placeholder="https://example.com/details"
              {...register('action_url')}
            />
            {errors.action_url && (
              <p className="text-sm text-destructive">{errors.action_url.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Ссылка на страницу с дополнительной информацией
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || broadcastNotification.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Megaphone className="mr-2 h-4 w-4" />
              {broadcastNotification.isPending ? 'Отправка...' : 'Отправить всем'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
