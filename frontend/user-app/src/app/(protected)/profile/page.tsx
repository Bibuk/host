'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, Mail, Phone, Globe, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth';
import { useUpdateProfile } from '@/lib/hooks/useUsers';
import { updateProfileSchema, type UpdateProfileInput } from '@/lib/validations/user';
import { getInitials, getFullName } from '@/lib/utils';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.first_name || '',
      lastName: user?.last_name || '',
      username: user?.username || '',
      phone: user?.phone || '',
      timezone: user?.timezone || 'UTC',
      locale: user?.locale || 'ru',
    },
  });

  const onSubmit = (data: UpdateProfileInput) => {
    updateProfile({
      first_name: data.firstName,
      last_name: data.lastName,
      username: data.username,
      phone: data.phone,
      timezone: data.timezone,
      locale: data.locale,
    });
  };

  const fullName = getFullName(user?.first_name, user?.last_name);
  const initials = getInitials(fullName, user?.email);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Профиль</h1>
        <p className="text-muted-foreground">
          Управляйте своими личными данными
        </p>
      </div>

      <div className="grid gap-6">
        {/* Avatar Card */}
        <Card>
          <CardHeader>
            <CardTitle>Аватар</CardTitle>
            <CardDescription>
              Нажмите на аватар для загрузки нового изображения
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative group cursor-pointer">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold">{fullName || 'Пользователь'}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                {user?.username && (
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>Личные данные</CardTitle>
            <CardDescription>
              Обновите свою личную информацию
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Имя</Label>
                  <Input
                    id="firstName"
                    placeholder="Иван"
                    {...register('firstName')}
                    disabled={isPending}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Фамилия</Label>
                  <Input
                    id="lastName"
                    placeholder="Иванов"
                    {...register('lastName')}
                    disabled={isPending}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Имя пользователя</Label>
                <Input
                  id="username"
                  placeholder="ivan_ivanov"
                  {...register('username')}
                  disabled={isPending}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username.message}</p>
                )}
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Телефон
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+7 (999) 123-45-67"
                    {...register('phone')}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Часовой пояс
                  </Label>
                  <Input
                    id="timezone"
                    placeholder="Europe/Moscow"
                    {...register('timezone')}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isPending || !isDirty}>
                  {isPending ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Email info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{user?.email}</p>
                <p className="text-sm text-muted-foreground">
                  {user?.email_verified
                    ? 'Email подтверждён'
                    : 'Email не подтверждён'}
                </p>
              </div>
              {!user?.email_verified && (
                <Button variant="outline" size="sm">
                  Подтвердить
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
