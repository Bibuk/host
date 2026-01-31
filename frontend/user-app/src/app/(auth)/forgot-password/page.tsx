'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Shield, ArrowLeft, Mail, CheckCircle, HelpCircle, Lock } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth';
import { useForgotPassword } from '@/lib/hooks/useAuth';

export default function ForgotPasswordPage() {
  const { mutate: forgotPassword, isPending, isSuccess } = useForgotPassword();
  const [submittedEmail, setSubmittedEmail] = useState('');

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
    setSubmittedEmail(data.email);
    forgotPassword(data.email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 text-center pb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg">
                  {isSuccess ? (
                    <Mail className="h-8 w-8 text-primary-foreground" />
                  ) : (
                    <Lock className="h-8 w-8 text-primary-foreground" />
                  )}
                </div>
                {isSuccess && (
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              {isSuccess ? 'Проверьте почту' : 'Восстановление пароля'}
            </CardTitle>
            <CardDescription className="text-base">
              {isSuccess
                ? 'Мы отправили инструкции на вашу почту'
                : 'Введите email для получения ссылки на сброс'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isSuccess ? (
              <div className="space-y-6">
                <Alert variant="success" className="border-green-200 bg-green-50 dark:bg-green-900/20">
                  <Mail className="h-4 w-4" />
                  <AlertTitle>Письмо отправлено!</AlertTitle>
                  <AlertDescription>
                    Мы отправили инструкции по сбросу пароля на адрес{' '}
                    <span className="font-medium">{submittedEmail}</span>
                  </AlertDescription>
                </Alert>

                <div className="space-y-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Что делать дальше?</p>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Проверьте входящие сообщения</li>
                    <li>Если письма нет — проверьте папку «Спам»</li>
                    <li>Перейдите по ссылке из письма</li>
                    <li>Создайте новый надёжный пароль</li>
                  </ol>
                </div>

                <div className="space-y-2 pt-4">
                  <Link href="/login">
                    <Button className="w-full">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Вернуться к входу
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => forgotPassword(submittedEmail)}
                    disabled={isPending}
                  >
                    {isPending ? 'Отправка...' : 'Отправить письмо ещё раз'}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                  {isPending ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Отправка...
                    </>
                  ) : (
                    'Отправить ссылку для сброса'
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          {!isSuccess && (
            <CardFooter className="flex flex-col space-y-4 pt-0">
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    или
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Link href="/login" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Назад к входу
                  </Button>
                </Link>
                <Link href="/register" className="flex-1">
                  <Button variant="ghost" className="w-full">
                    Создать аккаунт
                  </Button>
                </Link>
              </div>
            </CardFooter>
          )}
        </Card>

        {/* Help Section */}
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Не помните email?</p>
                <p className="text-muted-foreground mt-1">
                  Если вы не помните email, привязанный к аккаунту, обратитесь в службу поддержки.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
