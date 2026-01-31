import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from '@/lib/api/sessions';
import { toast } from '@/components/ui/use-toast';

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: sessionsApi.getSessions,
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sessionsApi.revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast({
        title: 'Успешно',
        description: 'Сессия завершена',
      });
    },
    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось завершить сессию',
        variant: 'destructive',
      });
    },
  });
}

export function useRevokeAllSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sessionsApi.revokeAllSessions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast({
        title: 'Успешно',
        description: 'Все сессии завершены (кроме текущей)',
      });
    },
    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось завершить сессии',
        variant: 'destructive',
      });
    },
  });
}
