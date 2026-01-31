'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, getFullName, cn } from '@/lib/utils';

interface UserAvatarProps {
  user: {
    avatar_url?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email: string;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
};

export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  const fullName = getFullName(user.first_name, user.last_name);
  const initials = getInitials(fullName, user.email);

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={user.avatar_url || undefined} alt={fullName} />
      <AvatarFallback className="bg-primary text-primary-foreground">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
