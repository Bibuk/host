# User Management System - User App

Пользовательское веб-приложение для системы управления пользователями.

## Технологии

- **Next.js 14** - React фреймворк с App Router
- **TypeScript** - Типизация
- **Tailwind CSS** - Стилизация
- **shadcn/ui** - UI компоненты
- **Zustand** - State management
- **TanStack Query** - Data fetching
- **React Hook Form + Zod** - Формы и валидация
- **Axios** - HTTP клиент

## Установка

```bash
# Перейти в директорию
cd frontend/user-app

# Установить зависимости
npm install

# Скопировать и настроить переменные окружения
cp .env.local.example .env.local

# Запустить в режиме разработки
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

## Структура проекта

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Группа страниц авторизации
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (protected)/       # Защищённые страницы
│   │   ├── dashboard/
│   │   ├── profile/
│   │   ├── settings/
│   │   └── notifications/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx           # Landing page
├── components/
│   ├── providers/         # React providers
│   └── ui/                # UI компоненты (shadcn)
├── hooks/                 # Custom hooks
├── lib/
│   ├── api/              # API клиенты
│   ├── hooks/            # Query hooks
│   └── validations/      # Zod схемы
├── stores/               # Zustand stores
├── types/                # TypeScript типы
└── middleware.ts         # Auth middleware
```

## Функциональность

### Публичные страницы
- **/** - Landing page
- **/login** - Вход в систему
- **/register** - Регистрация
- **/forgot-password** - Восстановление пароля

### Защищённые страницы (требуют авторизации)
- **/dashboard** - Личный кабинет
- **/profile** - Редактирование профиля
- **/settings** - Общие настройки
- **/settings/security** - Безопасность (смена пароля)
- **/settings/sessions** - Активные сессии
- **/notifications** - Уведомления

## Команды

```bash
npm run dev      # Запуск dev сервера
npm run build    # Сборка для production
npm run start    # Запуск production сервера
npm run lint     # Проверка линтером
```

## Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| NEXT_PUBLIC_API_URL | URL бекенда | http://localhost:8000/api/v1 |
| NEXT_PUBLIC_APP_NAME | Название приложения | User App |
| NEXT_PUBLIC_APP_URL | URL приложения | http://localhost:3000 |

## Связь с бекендом

Приложение работает с FastAPI бекендом из директории `user-management-system`.
Убедитесь, что бекенд запущен на порту 8000 перед использованием фронтенда.

```bash
# В директории user-management-system
docker-compose up -d
```
