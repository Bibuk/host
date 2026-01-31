'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, getFullName, cn } from '@/lib/utils';

interface UserAvatarWithObjectProps {
  user: {
    avatar_url?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email: string;
  };
  name?: never;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface UserAvatarWithNameProps {
  name: string;
  user?: never;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

type UserAvatarProps = UserAvatarWithObjectProps | UserAvatarWithNameProps;

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
};

export function UserAvatar({ user, name, size = 'md', className }: UserAvatarProps) {
  let fullName: string;
  let initials: string;
  let avatarUrl: string | undefined;

  if (user) {
    fullName = getFullName(user.first_name, user.last_name);
    initials = getInitials(fullName, user.email);
    avatarUrl = user.avatar_url || undefined;
  } else if (name) {
    fullName = name;
    initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || name.slice(0, 2).toUpperCase();
    avatarUrl = undefined;
  } else {
    fullName = 'User';
    initials = 'U';
    avatarUrl = undefined;
  }

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={avatarUrl} alt={fullName} />
      <AvatarFallback className="bg-primary text-primary-foreground">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
