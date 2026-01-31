'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings, Globe, Clock, Bell, Moon, Sun, Monitor, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/auth';
import { useUpdateProfile } from '@/lib/hooks/useUsers';

const settingsSchema = z.object({
  locale: z.string(),
  timezone: z.string(),
});

type SettingsInput = z.infer<typeof settingsSchema>;

const timezones = [
  { value: 'Europe/Moscow', label: 'Москва (UTC+3)' },
  { value: 'Europe/Kaliningrad', label: 'Калининград (UTC+2)' },
  { value: 'Europe/Samara', label: 'Самара (UTC+4)' },
  { value: 'Asia/Yekaterinburg', label: 'Екатеринбург (UTC+5)' },
  { value: 'Asia/Omsk', label: 'Омск (UTC+6)' },
  { value: 'Asia/Krasnoyarsk', label: 'Красноярск (UTC+7)' },
  { value: 'Asia/Irkutsk', label: 'Иркутск (UTC+8)' },
  { value: 'Asia/Yakutsk', label: 'Якутск (UTC+9)' },
  { value: 'Asia/Vladivostok', label: 'Владивосток (UTC+10)' },
  { value: 'Asia/Magadan', label: 'Магадан (UTC+11)' },
  { value: 'Asia/Kamchatka', label: 'Камчатка (UTC+12)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/London', label: 'Лондон (UTC+0)' },
  { value: 'Europe/Paris', label: 'Париж (UTC+1)' },
  { value: 'America/New_York', label: 'Нью-Йорк (UTC-5)' },
  { value: 'America/Los_Angeles', label: 'Лос-Анджелес (UTC-8)' },
];

const locales = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];

export default function GeneralSettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Настройки уведомлений (локальные)
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    securityAlerts: true,
    marketingEmails: false,
    browserNotifications: false,
  });

  useEffect(() => {
    setMounted(true);
    // Загружаем настройки уведомлений из localStorage
    const savedSettings = localStorage.getItem('notification-settings');
    if (savedSettings) {
      try {
        setNotificationSettings(JSON.parse(savedSettings));
      } catch {}
    }
  }, []);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isDirty },
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      locale: user?.locale || 'ru',
      timezone: user?.timezone || 'Europe/Moscow',
    },
  });

  const currentLocale = watch('locale');
  const currentTimezone = watch('timezone');

  const onSubmit = (data: SettingsInput) => {
    updateProfile(data, {
      onSuccess: () => {
        updateUser(data);
      },
    });
  };

  const handleNotificationChange = (key: keyof typeof notificationSettings, value: boolean) => {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    localStorage.setItem('notification-settings', JSON.stringify(newSettings));
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Общие настройки</h1>
        <p className="text-muted-foreground">
          Настройте внешний вид и поведение приложения
        </p>
      </div>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Тема оформления
          </CardTitle>
          <CardDescription>
            Выберите предпочитаемую тему оформления
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                theme === 'light' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-muted-foreground/50'
              }`}
            >
              <Sun className="h-6 w-6" />
              <span className="text-sm font-medium">Светлая</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                theme === 'dark' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-muted-foreground/50'
              }`}
            >
              <Moon className="h-6 w-6" />
              <span className="text-sm font-medium">Тёмная</span>
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                theme === 'system' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-muted-foreground/50'
              }`}
            >
              <Monitor className="h-6 w-6" />
              <span className="text-sm font-medium">Системная</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Locale & Timezone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Региональные настройки
          </CardTitle>
          <CardDescription>
            Настройте язык и часовой пояс
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Язык интерфейса</Label>
                <Select 
                  value={currentLocale} 
                  onValueChange={(value) => setValue('locale', value, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите язык" />
                  </SelectTrigger>
                  <SelectContent>
                    {locales.map((locale) => (
                      <SelectItem key={locale.value} value={locale.value}>
                        {locale.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Часовой пояс</Label>
                <Select 
                  value={currentTimezone} 
                  onValueChange={(value) => setValue('timezone', value, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите часовой пояс" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isDirty && (
              <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Уведомления
          </CardTitle>
          <CardDescription>
            Настройте способы получения уведомлений
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email-уведомления</Label>
              <p className="text-sm text-muted-foreground">
                Получать важные уведомления на email
              </p>
            </div>
            <Switch
              checked={notificationSettings.emailNotifications}
              onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Уведомления о безопасности</Label>
              <p className="text-sm text-muted-foreground">
                Получать уведомления о входах и подозрительной активности
              </p>
            </div>
            <Switch
              checked={notificationSettings.securityAlerts}
              onCheckedChange={(checked) => handleNotificationChange('securityAlerts', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Маркетинговые рассылки</Label>
              <p className="text-sm text-muted-foreground">
                Получать новости и специальные предложения
              </p>
            </div>
            <Switch
              checked={notificationSettings.marketingEmails}
              onCheckedChange={(checked) => handleNotificationChange('marketingEmails', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push-уведомления в браузере</Label>
              <p className="text-sm text-muted-foreground">
                Показывать уведомления в браузере
              </p>
            </div>
            <Switch
              checked={notificationSettings.browserNotifications}
              onCheckedChange={(checked) => handleNotificationChange('browserNotifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Current Time Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Текущее время
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">По выбранному часовому поясу</p>
              <p className="text-2xl font-bold">
                {new Date().toLocaleTimeString('ru-RU', { 
                  timeZone: currentTimezone,
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date().toLocaleDateString('ru-RU', { 
                  timeZone: currentTimezone,
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">UTC</p>
              <p className="text-2xl font-bold">
                {new Date().toLocaleTimeString('ru-RU', { 
                  timeZone: 'UTC',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Универсальное координированное время
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
