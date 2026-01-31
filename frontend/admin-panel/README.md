# User Management System - Admin Panel

Административная панель для системы управления пользователями.

## Технологии

- **Next.js 14** - React фреймворк с App Router
- **TypeScript** - Типизация
- **Tailwind CSS** - Стилизация
- **shadcn/ui** - UI компоненты
- **Zustand** - State management
- **TanStack Query** - Data fetching
- **TanStack Table** - Таблицы с сортировкой и пагинацией
- **React Hook Form + Zod** - Формы и валидация
- **Recharts** - Графики и визуализация
- **Axios** - HTTP клиент

## Установка

```bash
# Перейти в директорию
cd frontend/admin-panel

# Установить зависимости
npm install

# Скопировать и настроить переменные окружения
cp .env.local.example .env.local

# Запустить в режиме разработки (порт 3001)
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3001

## Структура проекта

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Страницы авторизации
│   │   └── login/
│   ├── (dashboard)/       # Защищённые страницы
│   │   ├── layout.tsx     # Layout с Sidebar и Header
│   │   ├── dashboard/
│   │   └── users/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── layout/           # Sidebar, Header
│   ├── providers/        # React providers
│   ├── shared/           # Переиспользуемые компоненты
│   └── ui/               # UI компоненты (shadcn)
├── hooks/                # Custom hooks
├── lib/
│   ├── api/             # API клиенты
│   ├── hooks/           # Query hooks
│   ├── utils.ts         # Utility функции
│   └── validations/     # Zod схемы
├── stores/              # Zustand stores
├── types/               # TypeScript типы
└── middleware.ts        # Auth middleware
```

## Функциональность

### Авторизация
- **/login** - Вход для администраторов

### Dashboard (защищённые)
- **/dashboard** - Главная панель со статистикой
- **/users** - Список пользователей с таблицей
- **/users/[id]** - Детальная информация о пользователе
- **/users/new** - Создание нового пользователя

### Возможности
- ✅ CRUD операции с пользователями
- ✅ Фильтрация и поиск
- ✅ Пагинация
- ✅ Смена статуса пользователей
- ✅ Тёмная/светлая тема
- ✅ Адаптивный дизайн
- ✅ Статистика на dashboard

## Команды

```bash
npm run dev      # Запуск dev сервера (порт 3001)
npm run build    # Сборка для production
npm run start    # Запуск production сервера
npm run lint     # Проверка линтером
```

## Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| NEXT_PUBLIC_API_URL | URL бекенда | http://localhost:8000/api/v1 |
| NEXT_PUBLIC_APP_NAME | Название приложения | Admin Panel |
| NEXT_PUBLIC_APP_URL | URL приложения | http://localhost:3001 |

## Ролевой доступ

Admin Panel предназначен для пользователей с ролями:
- **Super Admin** - Полный доступ
- **Admin** - Управление пользователями

## Связь с бекендом

Приложение работает с FastAPI бекендом из директории `user-management-system`.

```bash
# В директории user-management-system
docker-compose up -d
```
