# User Management System - Frontend

Фронтенд для системы управления пользователями, состоящий из двух приложений.

## Приложения

### 1. User App (порт 3000)
Пользовательское приложение для самообслуживания:
- Регистрация и авторизация
- Личный кабинет
- Управление профилем
- Смена пароля
- Управление сессиями

[Подробнее →](./user-app/README.md)

### 2. Admin Panel (порт 3001)
Административная панель для управления системой:
- Просмотр статистики
- Управление пользователями (CRUD)
- Смена статусов пользователей
- Фильтрация и поиск

[Подробнее →](./admin-panel/README.md)

## Быстрый старт

```bash
# 1. Запустить бекенд
cd ../user-management-system
docker-compose up -d

# 2. Запустить User App
cd ../frontend/user-app
npm install
cp .env.local.example .env.local
npm run dev

# 3. Запустить Admin Panel (в новом терминале)
cd ../frontend/admin-panel
npm install
cp .env.local.example .env.local
npm run dev
```

## Общий стек технологий

| Технология | Описание |
|------------|----------|
| Next.js 14 | React фреймворк с App Router |
| TypeScript | Статическая типизация |
| Tailwind CSS | Utility-first CSS |
| shadcn/ui | UI компоненты |
| Zustand | State management |
| TanStack Query | Server state / caching |
| React Hook Form | Управление формами |
| Zod | Валидация схем |
| Axios | HTTP клиент |

## Архитектура

```
frontend/
├── user-app/           # Пользовательское приложение (:3000)
│   ├── src/
│   │   ├── app/       # Роутинг
│   │   ├── components/ # Компоненты
│   │   ├── lib/       # Утилиты, API, хуки
│   │   └── stores/    # Zustand stores
│   └── package.json
│
├── admin-panel/        # Админ панель (:3001)
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── stores/
│   └── package.json
│
└── README.md
```

## API интеграция

Оба приложения подключаются к единому FastAPI бекенду:

- **Base URL**: `http://localhost:8000/api/v1`
- **Auth**: JWT токены (access + refresh)
- **Endpoints**: `/auth/*`, `/users/*`

## Разработка

### Добавление компонентов
Оба приложения используют паттерн shadcn/ui. Компоненты расположены в `src/components/ui/`.

### Добавление API endpoints
1. Добавить типы в `src/types/api.ts`
2. Создать API методы в `src/lib/api/`
3. Создать query hooks в `src/lib/hooks/`

### Стилизация
Используются CSS переменные для темизации. Основные цвета определены в `globals.css`.

## Требования

- Node.js 18+
- npm или yarn
- Запущенный бекенд (user-management-system)
