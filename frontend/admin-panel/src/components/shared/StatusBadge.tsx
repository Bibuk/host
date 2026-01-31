'use client';

import { Badge } from '@/components/ui/badge';
import { UserStatus } from '@/types/api';
import { userStatusConfig } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: UserStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = userStatusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
}
