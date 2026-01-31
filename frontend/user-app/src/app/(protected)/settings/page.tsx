'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Shield, Smartphone, ChevronRight, Globe, Bell, Palette } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const settingsNav = [
  { 
    title: 'Общие', 
    href: '/settings/general', 
    icon: Settings,
    description: 'Язык, тема и региональные настройки',
    features: ['Тема оформления', 'Язык', 'Часовой пояс', 'Уведомления']
  },
  { 
    title: 'Безопасность', 
    href: '/settings/security', 
    icon: Shield,
    description: 'Защита вашего аккаунта',
    features: ['Смена пароля', 'Уровень безопасности']
  },
  { 
    title: 'Сессии', 
    href: '/settings/sessions', 
    icon: Smartphone,
    description: 'Управление активными устройствами',
    features: ['Активные сессии', 'Завершение сессий']
  },
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

      <div className="grid gap-4">
        {settingsNav.map((item) => {
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <Card className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.features.map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Info */}
      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">Подсказка</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Регулярно проверяйте настройки безопасности и активные сессии для защиты вашего аккаунта. 
                Завершайте сессии на устройствах, которыми больше не пользуетесь.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
