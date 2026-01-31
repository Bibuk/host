import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Форматирование даты
export function formatDate(date: string | Date, locale = 'ru-RU'): string {
  return new Date(date).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date, locale = 'ru-RU'): string {
  return new Date(date).toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'только что';
  if (diffMins < 60) return `${diffMins} мин назад`;
  if (diffHours < 24) return `${diffHours} ч назад`;
  if (diffDays < 7) return `${diffDays} дн назад`;
  return formatDate(date);
}

// Получить инициалы
export function getInitials(name?: string | null, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return '??';
}

// Статусы пользователя
export const userStatusConfig = {
  active: { label: 'Активен', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  inactive: { label: 'Неактивен', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  suspended: { label: 'Заблокирован', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  locked: { label: 'Заморожен', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  pending_verification: { label: 'Ожидает', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
};

// Debounce для поиска
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Query string builder
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
}

// Full name helper
export function getFullName(firstName?: string | null, lastName?: string | null, email?: string): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : email || 'Unknown';
}
