'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Shield, Eye, EyeOff, Check, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';
import { useRegister } from '@/lib/hooks/useAuth';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: registerUser, isPending } = useRegister();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    },
  });

  const password = watch('password');

  const passwordRequirements = [
    { label: 'Минимум 8 символов', valid: password?.length >= 8 },
    { label: 'Заглавная буква', valid: /[A-Z]/.test(password || '') },
    { label: 'Строчная буква', valid: /[a-z]/.test(password || '') },
    { label: 'Цифра', valid: /[0-9]/.test(password || '') },
  ];

  const onSubmit = (data: RegisterInput) => {
    registerUser({
      email: data.email,
      password: data.password,
      first_name: data.firstName,
      last_name: data.lastName,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Link href="/" className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold">Создать аккаунт</CardTitle>
          <CardDescription>
            Введите данные для регистрации
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Имя</Label>
                <Input
                  id="firstName"
                  placeholder="Иван"
                  {...register('firstName')}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Фамилия</Label>
                <Input
                  id="lastName"
                  placeholder="Иванов"
                  {...register('lastName')}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register('email')}
                disabled={isPending}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  disabled={isPending}
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
              {/* Password requirements */}
              {password && (
                <div className="grid grid-cols-2 gap-1 text-xs mt-2">
                  {passwordRequirements.map((req) => (
                    <div
                      key={req.label}
                      className={`flex items-center gap-1 ${
                        req.valid ? 'text-green-600' : 'text-muted-foreground'
                      }`}
                    >
                      {req.valid ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      {req.label}
                    </div>
                  ))}
                </div>
              )}
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                disabled={isPending}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Войти
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
