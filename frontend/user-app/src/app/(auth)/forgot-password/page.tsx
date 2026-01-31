'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth';
import { useForgotPassword } from '@/lib/hooks/useAuth';

export default function ForgotPasswordPage() {
  const { mutate: forgotPassword, isPending, isSuccess } = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    forgotPassword(data.email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Восстановление пароля</CardTitle>
          <CardDescription>
            {isSuccess
              ? 'Проверьте почту для инструкций по сбросу пароля'
              : 'Введите email для получения ссылки на сброс пароля'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Если аккаунт с этим email существует, вы получите письмо 
                с инструкциями по сбросу пароля.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Вернуться к входу
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Отправка...' : 'Отправить ссылку'}
              </Button>

              <Link href="/login" className="block">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Назад к входу
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
