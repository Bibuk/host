'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createUserSchema, updateUserAdminSchema, type CreateUserInput, type UpdateUserAdminInput } from '@/lib/validations/user';
import { UserStatus } from '@/types/api';
import type { User } from '@/types/api';

interface UserFormProps {
  user?: User;
  onSubmit: (data: CreateUserInput | UpdateUserAdminInput) => Promise<void>;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

const statusOptions = [
  { value: UserStatus.ACTIVE, label: 'Активен' },
  { value: UserStatus.INACTIVE, label: 'Неактивен' },
  { value: UserStatus.SUSPENDED, label: 'Заблокирован' },
  { value: UserStatus.LOCKED, label: 'Заморожен' },
  { value: UserStatus.PENDING_VERIFICATION, label: 'Ожидает верификации' },
];

export function UserForm({ user, onSubmit, isLoading, mode }: UserFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isEdit = mode === 'edit';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateUserInput | UpdateUserAdminInput>({
    resolver: zodResolver(isEdit ? updateUserAdminSchema : createUserSchema),
    defaultValues: isEdit && user ? {
      email: user.email,
      username: user.username || '',
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      phone: user.phone || '',
      status: user.status,
      emailVerified: user.email_verified,
    } : {
      email: '',
      password: '',
      username: '',
      firstName: '',
      lastName: '',
      phone: '',
    },
  });

  const status = watch('status' as keyof UpdateUserAdminInput);
  const emailVerified = watch('emailVerified' as keyof UpdateUserAdminInput);

  const handleFormSubmit = async (data: CreateUserInput | UpdateUserAdminInput) => {
    // Clean up empty strings to nulls
    const cleanData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === '' ? null : value,
      ])
    );
    await onSubmit(cleanData as CreateUserInput | UpdateUserAdminInput);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
          <CardDescription>
            {isEdit ? 'Редактирование данных пользователя' : 'Данные нового пользователя'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {!isEdit && (
              <div className="space-y-2">
                <Label htmlFor="password">Пароль *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Минимум 8 символов"
                    {...register('password' as keyof CreateUserInput)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {(errors as { password?: { message?: string } }).password?.message}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Имя</Label>
              <Input
                id="firstName"
                placeholder="Иван"
                {...register('firstName')}
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
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="username">Имя пользователя</Label>
              <Input
                id="username"
                placeholder="ivan_ivanov"
                {...register('username')}
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+7 (999) 123-45-67"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Controls (Edit mode only) */}
      {isEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Административные настройки</CardTitle>
            <CardDescription>
              Статус и подтверждение email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Статус пользователя</Label>
                <Select
                  value={status as UserStatus | undefined}
                  onValueChange={(value) => setValue('status' as keyof UpdateUserAdminInput, value as UserStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Email подтверждён</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="emailVerified"
                    checked={emailVerified as boolean | undefined}
                    onCheckedChange={(checked) => 
                      setValue('emailVerified' as keyof UpdateUserAdminInput, checked)
                    }
                  />
                  <Label htmlFor="emailVerified" className="font-normal">
                    {emailVerified ? 'Да' : 'Нет'}
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Сохранение...' : isEdit ? 'Сохранить изменения' : 'Создать пользователя'}
        </Button>
      </div>
    </form>
  );
}
