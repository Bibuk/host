import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().max(100).optional().nullable(),
  lastName: z.string().max(100).optional().nullable(),
  username: z
    .string()
    .min(3, 'Минимум 3 символа')
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Только буквы, цифры, _ и -')
    .optional()
    .nullable(),
  phone: z.string().max(20).optional().nullable(),
  timezone: z.string().max(50).optional(),
  locale: z.string().max(10).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Введите текущий пароль'),
  newPassword: z
    .string()
    .min(8, 'Минимум 8 символов')
    .regex(/[A-Z]/, 'Нужна заглавная буква')
    .regex(/[a-z]/, 'Нужна строчная буква')
    .regex(/[0-9]/, 'Нужна цифра'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
