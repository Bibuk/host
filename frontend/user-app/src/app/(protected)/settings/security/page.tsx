'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, Key, Eye, EyeOff, Check, X, AlertCircle, Smartphone, History, LogOut } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useChangePassword } from '@/lib/hooks/useUsers';
import { useSessions, useRevokeAllSessions } from '@/lib/hooks/useSessions';
import { useAuthStore } from '@/stores/auth';
import { changePasswordSchema, type ChangePasswordInput } from '@/lib/validations/user';

export default function SecuritySettingsPage() {
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const { user } = useAuthStore();
  const { mutate: changePassword, isPending } = useChangePassword();
  const { data: sessions } = useSessions();
  const { mutate: revokeAll, isPending: isRevokingAll } = useRevokeAllSessions();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

  // Проверка требований к паролю
  const passwordRequirements = [
    { label: 'Минимум 8 символов', valid: (newPassword?.length || 0) >= 8 },
    { label: 'Заглавная буква', valid: /[A-Z]/.test(newPassword || '') },
    { label: 'Строчная буква', valid: /[a-z]/.test(newPassword || '') },
    { label: 'Цифра', valid: /[0-9]/.test(newPassword || '') },
  ];

  const passwordStrength = passwordRequirements.filter(r => r.valid).length;
  const passwordStrengthPercent = (passwordStrength / passwordRequirements.length) * 100;

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return { label: '', color: 'bg-muted' };
    if (passwordStrength <= 1) return { label: 'Слабый', color: 'bg-red-500' };
    if (passwordStrength <= 2) return { label: 'Средний', color: 'bg-yellow-500' };
    if (passwordStrength <= 3) return { label: 'Хороший', color: 'bg-blue-500' };
    return { label: 'Отличный', color: 'bg-green-500' };
  };

  const strengthInfo = getPasswordStrengthLabel();

  // Оценка безопасности аккаунта
  const calculateSecurityScore = () => {
    let score = 0;
    if (user?.email_verified) score += 40;
    // Пароль считаем установленным
    score += 40;
    // За активные сессии (не слишком много)
    if (sessions && sessions.length <= 3) score += 20;
    else if (sessions && sessions.length <= 5) score += 10;
    return score;
  };

  const securityScore = calculateSecurityScore();

  const onSubmit = (data: ChangePasswordInput) => {
    changePassword(
      {
        current_password: data.currentPassword,
        new_password: data.newPassword,
      },
      {
        onSuccess: () => reset(),
      }
    );
  };

  const togglePassword = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Безопасность</h1>
        <p className="text-muted-foreground">
          Управляйте настройками безопасности вашего аккаунта
        </p>
      </div>

      {/* Security Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Уровень безопасности
          </CardTitle>
          <CardDescription>
            Общая оценка защищенности вашего аккаунта
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{securityScore}%</span>
            <Badge variant={securityScore >= 80 ? 'success' : securityScore >= 50 ? 'warning' : 'destructive'}>
              {securityScore >= 80 ? 'Отлично' : securityScore >= 50 ? 'Хорошо' : 'Требует внимания'}
            </Badge>
          </div>
          <Progress value={securityScore} className="h-3" />
          
          <div className="grid gap-2 mt-4">
            <div className="flex items-center gap-2">
              {user?.email_verified ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">Email подтверждён</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Пароль установлен</span>
            </div>
            <div className="flex items-center gap-2">
              {sessions && sessions.length <= 3 ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
              <span className="text-sm">
                {sessions?.length || 0} активных сессий
                {sessions && sessions.length > 3 && ' (рекомендуется меньше)'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Смена пароля
          </CardTitle>
          <CardDescription>
            Регулярно меняйте пароль для повышения безопасности
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Текущий пароль</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? 'text' : 'password'}
                  placeholder="Введите текущий пароль"
                  {...register('currentPassword')}
                  disabled={isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => togglePassword('current')}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.currentPassword && (
                <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="newPassword">Новый пароль</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? 'text' : 'password'}
                  placeholder="Введите новый пароль"
                  {...register('newPassword')}
                  disabled={isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => togglePassword('new')}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-destructive">{errors.newPassword.message}</p>
              )}
              
              {/* Password strength indicator */}
              {newPassword && (
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
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтвердите новый пароль</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  placeholder="Повторите новый пароль"
                  {...register('confirmPassword')}
                  disabled={isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => togglePassword('confirm')}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Сохранение...' : 'Сменить пароль'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Active Sessions Quick View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Активные сессии
          </CardTitle>
          <CardDescription>
            Устройства, на которых выполнен вход в ваш аккаунт
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{sessions?.length || 0} активных устройств</p>
                <p className="text-sm text-muted-foreground">
                  {sessions?.filter(s => s.is_current).length === 1 
                    ? 'Включая это устройство' 
                    : 'Управляйте сессиями'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => revokeAll()}
                disabled={isRevokingAll}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isRevokingAll ? 'Выход...' : 'Выйти везде'}
              </Button>
              <Link href="/settings/sessions">
                <Button variant="outline" size="sm">
                  Подробнее
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Советы по безопасности</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
            <li>Используйте уникальный пароль, который не используете на других сайтах</li>
            <li>Никогда не сообщайте свой пароль другим людям</li>
            <li>Регулярно проверяйте активные сессии и завершайте неиспользуемые</li>
            <li>Подтвердите email для восстановления доступа к аккаунту</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
