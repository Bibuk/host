'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Shield, Eye, EyeOff, Check, X, User, Mail, Lock, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';
import { useRegister } from '@/lib/hooks/useAuth';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
  const confirmPassword = watch('confirmPassword');

  const passwordRequirements = [
    { label: 'Минимум 8 символов', valid: password?.length >= 8 },
    { label: 'Заглавная буква', valid: /[A-Z]/.test(password || '') },
    { label: 'Строчная буква', valid: /[a-z]/.test(password || '') },
    { label: 'Цифра', valid: /[0-9]/.test(password || '') },
  ];

  const passwordStrength = passwordRequirements.filter(r => r.valid).length;
  const passwordStrengthPercent = (passwordStrength / passwordRequirements.length) * 100;

  const getPasswordStrengthInfo = () => {
    if (passwordStrength === 0) return { label: '', color: 'bg-muted' };
    if (passwordStrength <= 1) return { label: 'Слабый', color: 'bg-red-500' };
    if (passwordStrength <= 2) return { label: 'Средний', color: 'bg-yellow-500' };
    if (passwordStrength <= 3) return { label: 'Хороший', color: 'bg-blue-500' };
    return { label: 'Отличный', color: 'bg-green-500' };
  };

  const strengthInfo = getPasswordStrengthInfo();

  const onSubmit = (data: RegisterInput) => {
    registerUser({
      email: data.email,
      password: data.password,
      first_name: data.firstName,
      last_name: data.lastName,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="flex justify-center mb-6">
              <Link href="/" className="flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg hover:scale-105 transition-transform">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </Link>
            </div>
            <CardTitle className="text-2xl font-bold">Создать аккаунт</CardTitle>
            <CardDescription className="text-base">
              Заполните форму для регистрации
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Имя</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      placeholder="Иван"
                      className="pl-10"
                      {...register('firstName')}
                      disabled={isPending}
                    />
                  </div>
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

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10"
                    {...register('email')}
                    disabled={isPending}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
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
                
                {/* Password strength indicator */}
                {password && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Надёжность пароля</span>
                      <span className="text-xs font-medium">{strengthInfo.label}</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${strengthInfo.color}`}
                        style={{ width: `${passwordStrengthPercent}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {passwordRequirements.map((req) => (
                        <div
                          key={req.label}
                          className={`flex items-center gap-1 ${
                            req.valid ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
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
                  </div>
                )}
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    {...register('confirmPassword')}
                    disabled={isPending}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {confirmPassword && password && (
                  <div className={`flex items-center gap-1 text-xs ${
                    confirmPassword === password ? 'text-green-600 dark:text-green-400' : 'text-destructive'
                  }`}>
                    {confirmPassword === password ? (
                      <>
                        <Check className="h-3 w-3" />
                        Пароли совпадают
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3" />
                        Пароли не совпадают
                      </>
                    )}
                  </div>
                )}
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Регистрация...
                  </>
                ) : (
                  'Создать аккаунт'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-2">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Уже есть аккаунт?
                </span>
              </div>
            </div>
            
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">
                Войти
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Регистрируясь, вы соглашаетесь с{' '}
          <Link href="/terms" className="underline hover:text-primary">
            Условиями использования
          </Link>
          {' '}и{' '}
          <Link href="/privacy" className="underline hover:text-primary">
            Политикой конфиденциальности
          </Link>
        </p>
      </div>
    </div>
  );
}
