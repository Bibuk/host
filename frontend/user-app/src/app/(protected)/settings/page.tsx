'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Shield, Smartphone } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const settingsNav = [
  { title: 'Общие', href: '/settings', icon: Settings },
  { title: 'Безопасность', href: '/settings/security', icon: Shield },
  { title: 'Сессии', href: '/settings/sessions', icon: Smartphone },
];

export default function SettingsPage() {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Настройки</h1>
        <p className="text-muted-foreground">
          Управляйте настройками вашего аккаунта
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {settingsNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <Card className={cn(
                'hover:shadow-md transition-all cursor-pointer',
                isActive && 'border-primary'
              )}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'h-10 w-10 rounded-lg flex items-center justify-center',
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    {item.title === 'Общие' && 'Язык, тема и другие настройки интерфейса'}
                    {item.title === 'Безопасность' && 'Пароль и двухфакторная аутентификация'}
                    {item.title === 'Сессии' && 'Активные устройства и сессии'}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
