'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { UserForm } from '@/components/users/UserForm';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { useUser, useUpdateUser } from '@/lib/hooks/useUsers';
import type { UpdateUserAdminInput } from '@/lib/validations/user';
import { UserStatus } from '@/types/api';

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { data: user, isLoading: isLoadingUser } = useUser(userId);
  const { mutateAsync: updateUser, isPending: isUpdating } = useUpdateUser();

  const handleSubmit = async (data: UpdateUserAdminInput) => {
    await updateUser({
      id: userId,
      data: {
        email: data.email,
        username: data.username,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        status: data.status as UserStatus,
        email_verified: data.emailVerified,
      },
    });
    router.push(`/users/${userId}`);
  };

  if (isLoadingUser) {
    return <PageLoader />;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Пользователь не найден</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Назад
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Редактирование пользователя</h1>
          <p className="text-muted-foreground">
            {user.email}
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <UserForm
          user={user}
          mode="edit"
          onSubmit={handleSubmit as (data: import('@/lib/validations/user').CreateUserInput | UpdateUserAdminInput) => Promise<void>}
          isLoading={isUpdating}
        />
      </div>
    </div>
  );
}
