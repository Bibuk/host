'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { UserForm } from '@/components/users/UserForm';
import { useCreateUser } from '@/lib/hooks/useUsers';
import type { CreateUserInput } from '@/lib/validations/user';

export default function NewUserPage() {
  const router = useRouter();
  const { mutateAsync: createUser, isPending } = useCreateUser();

  const handleSubmit = async (data: CreateUserInput) => {
    await createUser({
      email: data.email,
      password: data.password,
      username: data.username || undefined,
      first_name: data.firstName || undefined,
      last_name: data.lastName || undefined,
      phone: data.phone || undefined,
    });
    router.push('/users');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Новый пользователь</h1>
          <p className="text-muted-foreground">
            Создание нового пользователя в системе
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <UserForm
          mode="create"
          onSubmit={handleSubmit as (data: CreateUserInput | import('@/lib/validations/user').UpdateUserAdminInput) => Promise<void>}
          isLoading={isPending}
        />
      </div>
    </div>
  );
}
