# SaaS Project Portal

Многопользовательский SaaS портал для управления проектами компаний с документами, задачами, финансами, согласованиями и чатом.

## 🏗️ Архитектура

- **Monorepo** (Turborepo + PNPM workspaces)
- **Backend**: NestJS + Drizzle ORM + PostgreSQL + Redis + Socket.IO
- **Frontend**: Next.js 14 + TailwindCSS + shadcn/ui + TanStack Query
- **Multi-tenancy**: по `company_id` с RLS в PostgreSQL

## 📁 Структура проекта

```
/apps
  /api     # NestJS API сервер
  /web     # Next.js веб-приложение
/packages
  /shared  # Общие типы и DTOs (Zod)
  /sdk     # Сгенерированный API клиент
  /ui      # Переиспользуемые UI компоненты
  /config  # ESLint/TypeScript конфигурации
```

## 🚀 Быстрый старт

### Требования
- Node.js 18.17+
- PNPM 8.0+
- PostgreSQL 15+
- Redis

### Установка

```bash
# Установка зависимостей
pnpm install

# Настройка окружения (создайте .env файлы)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### Запуск в dev режиме

```bash
# Запуск всех сервисов
pnpm dev

# Или отдельно:
pnpm --filter api dev    # API на http://localhost:3001
pnpm --filter web dev    # Web на http://localhost:3000
```

## 📋 Доступные команды

```bash
pnpm build              # Сборка всех приложений
pnpm dev               # Запуск в режиме разработки  
pnpm lint              # Линтинг кода
pnpm test              # Unit тесты
pnpm test:e2e          # E2E тесты (Playwright)
pnpm generate:sdk      # Генерация SDK из OpenAPI
pnpm format            # Форматирование кода
pnpm clean             # Очистка build артефактов
```

## 🔧 Технологический стек

### Backend
- **NestJS** - основной фреймворк
- **Drizzle ORM** - типобезопасный ORM
- **PostgreSQL** - основная БД с RLS для multi-tenancy
- **Redis** - очереди (BullMQ) и кеширование
- **Socket.IO** - WebSocket соединения
- **Zod** - валидация схем
- **JWT** - аутентификация

### Frontend  
- **Next.js 14** - React фреймворк (App Router)
- **TailwindCSS** - стилизация
- **shadcn/ui** - UI компоненты
- **TanStack Query** - управление состоянием сервера
- **React Hook Form** - формы с Zod валидацией
- **Socket.IO Client** - WebSocket клиент

### DevOps & Tooling
- **Turborepo** - монорепо сборка
- **PNPM** - пакетный менеджер  
- **ESLint & Prettier** - линтинг и форматирование
- **Vitest/Jest** - unit тестирование
- **Playwright** - E2E тестирование
- **Husky** - git хуки

## 🌟 Основные функции

### Проекты (Objects)
- ✅ Создание и управление проектами
- ✅ Многоуровневое управление ролями
- ✅ Назначение ответственного

### Документы  
- ✅ Загрузка через S3 presigned URLs
- ✅ Версионирование документов
- ✅ Просмотр PDF/изображений
- ✅ Отправка на согласование

### Задачи и расписание
- ✅ Иерархические задачи
- ✅ Kanban доска
- ✅ Диаграмма Ганта
- ✅ Вехи проекта

### Финансы
- ✅ Учёт расходов и доходов
- ✅ Расчёт маржинальности
- ✅ Бюджетные линии
- ✅ Финансовая аналитика

### Согласования (Approvals)
- ✅ Многоэтапные согласования  
- ✅ Правила ALL/ANY/QUORUM
- ✅ Обязательная причина отклонения
- ✅ Уведомления и эскалация

### Чат
- ✅ Потоки обсуждений по проектам
- ✅ Вложения и упоминания
- ✅ Читательские квитанции
- ✅ Реал-тайм через WebSocket

### Генерация документов
- ✅ Шаблоны (HTML/Handlebars → PDF, DOCX)
- ✅ Предложения (CPQ-lite) 
- ✅ Договоры
- ✅ Закрывающие документы (КС-2, КС-3, Акт, УПД)

### Нумерация
- ✅ Гибкая система маскирования
- ✅ Последовательности с периодичностью
- ✅ Идемпотентное присвоение номеров

## 🔐 Безопасность

- **Multi-tenancy**: изоляция по `company_id`
- **RLS**: политики безопасности на уровне PostgreSQL  
- **JWT**: аутентификация с ролями
- **RBAC**: контроль доступа на основе ролей
- **Rate limiting**: защита от злоупотреблений

## 📊 Мониторинг

- **Sentry**: отслеживание ошибок
- **OpenTelemetry**: трасировка запросов
- **Structured logging**: JSON логи
- **Health checks**: проверка состояния сервисов

## 🚀 Развертывание

### Окружения
- **API**: Fly.io / Railway / AWS ECS
- **Web**: Vercel / Cloudflare Pages  
- **DB**: Neon / Supabase / RDS
- **Redis**: Upstash / Redis Cloud
- **Storage**: AWS S3 / Backblaze B2

### CI/CD
GitHub Actions pipeline:
1. Линтинг и тестирование
2. Миграции БД (Drizzle)
3. Сборка и развертывание API
4. Сборка и развертывание Web

## 📈 Планы развития

- [ ] Мобильное приложение (React Native)
- [ ] Интеграции с внешними системами
- [ ] Расширенная аналитика
- [ ] Workflow автоматизация
- [ ] Интеграция с DocuSign/Диадок

## 🤝 Разработка

См. [Phase-by-Phase Development Guide](./SaaS_Project_Portal_Spec.md) для подробного плана разработки.

## 📝 Лицензия

Частная лицензия. Все права защищены.