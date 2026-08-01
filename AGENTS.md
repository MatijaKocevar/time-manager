# AGENTS.md — Time Manager

## Project Overview

A team time management system for tracking work hours, managing tasks, scheduling shifts, and handling time-off requests with approval workflows. Built with Next.js App Router and PostgreSQL.

## Tech Stack

- **Next.js 16** (App Router, React Server Components), **React 19**, **TypeScript 6**
- **PostgreSQL** via **Prisma ORM** (`@prisma/client` + `prisma`)
- **NextAuth.js v4** (credentials provider + email verification)
- **TanStack Query** for server state, **Zustand** for client state
- **Tailwind CSS 4** with **shadcn/ui** components (Radix primitives)
- **next-intl** for i18n (English and Slovenian)
- **React Hook Form** + **Zod 4** for form validation
- **Resend** for email, **web-push** for browser push notifications
- **SSE** for real-time tracker updates, **Pusher** as alternative channel
- **PWA** with service worker

## Commands

```bash
npm run dev               # Start dev server with HTTPS (via scripts/dev-https.sh)
npm run dev:https         # Start dev server directly
npm run build             # Production build
npm run start             # Production start
npm run lint              # ESLint
npm run format            # Prettier format
npm run format:check      # Prettier check (CI)

npm run db:generate       # Generate Prisma client
npm run db:push           # Push schema to DB (no migrations)
npm run db:migrate        # Run migrations (dev)
npm run db:migrate:deploy # Run migrations (prod)
npm run db:seed           # Seed test data
npm run db:seed:minimal   # Seed minimal data
npm run db:reset          # Reset DB (drops all)
npm run db:studio         # Open Prisma Studio

npm run deploy            # Deploy via PM2 (no migrate)
npm run deploy:migrate    # Deploy via PM2 (with migrate)
```

## Project Structure

```
src/
  app/                  # Next.js App Router pages
    (protected)/        # Authenticated routes (admin, hours, tasks, shifts, requests, tracker, time-sheets, profile, yearly-calendar)
    api/                # API route handlers
      tracker/          # SSE connections, events, broadcast
      tap-in/           # NFC tap-in/out endpoint
      auth/             # NextAuth config routes
      adjust-work-time/ # Work time adjustments
      internal/         # Internal endpoints
    login/
    register/
    verify-email/
  components/           # Shared UI components
    ui/                 # shadcn/ui components (Button, Dialog, etc.)
  features/             # Feature modules
    sidebar/            # App shell, navigation, sidebar
    theme/              # Dark/light mode
    notifications/      # In-app notifications center
    breadcrumbs/        # Breadcrumb navigation
    navigation/         # Navigation progress bar
    cookie-consent/     # Cookie consent banner
    tutorial/           # Driver.js tutorial
    locale/             # Locale switching
    export/             # Data export (Excel, CSV)
    pull-to-refresh/    # Mobile pull-to-refresh
  hooks/                # Custom React hooks
  lib/                  # Core library code
    auth.ts             # NextAuth configuration
    auth-helpers.ts     # Auth utility functions
    prisma.ts           # Prisma client singleton
    encryption.ts       # Field encryption/decryption
    sse-manager.ts      # Server-Sent Events manager
    timer-utils.ts      # Timer calculation utilities
    urnik-session.ts    # Urnik.net integration
    balance-helpers.ts  # Work hour balance calculations
    utils.ts            # General utilities
    storage/            # File storage helpers
  providers/            # React context providers
    QueryProvider.tsx   # TanStack Query provider
    SessionWrapper.tsx  # NextAuth session wrapper
  stores/               # Zustand stores
  types/                # TypeScript type definitions
prisma/
  schema.prisma         # Database schema (528 lines, 20+ models)
  migrations/           # Migration history
  seed/                 # Seed scripts
messages/
  en.json / sl.json     # i18n translation files
scripts/                # Utility and deployment scripts
docs/                   # Documentation
```

## Key Patterns

### Authentication

- NextAuth v4 with `authConfig` from `src/lib/auth.ts`
- Server sessions via `getServerSession(authConfig)`
- Protected routes under `src/app/(protected)/` use `layout.tsx` for auth gating
- Roles: `USER`, `ADMIN`, `GUEST`

### API Routes (App Router style)

- Routes live in `src/app/api/` as Next.js route handlers
- Export named functions: `GET`, `POST`, `PATCH`, `DELETE`
- Use `src/lib/auth.ts` for server-side auth

### Database Access

- Prisma client singleton in `src/lib/prisma.ts` — always import from here, never create new instances
- Server-side: direct Prisma queries in server components or API routes; use `prisma.$transaction` for atomic operations. **IMPORTANT**: All writes (mutative operations) MUST be done in server actions or API routes — never use Prisma client writes in server components (GET requests) or layouts
- Client-side: TanStack Query hooks calling API endpoints or server actions
- Server actions (functions with `"use server"`) are used for mutations

### Real-time Updates

- SSE (Server-Sent Events) managed by `src/lib/sse-manager.ts`
- Used for timer state broadcasting across clients
- Pusher available as alternative (configured in `src/lib/pusher-server.ts`)

### Forms & Validation

- React Hook Form with `@hookform/resolvers` for Zod schema integration
- Zod v4 schemas for all API/action inputs

### i18n

- `next-intl` with message files in `messages/`
- Server: `getTranslations()` from `next-intl/server`
- Client: `useTranslations()` from `next-intl`

### Theme

- Dark/light mode managed by `ThemeProvider` in `src/features/theme/`
- Inline script in root layout prevents flash
- Uses `classList.add('dark')` on `<html>`
- Persisted per-user in DB, falls back to localStorage for guests

## Conventions

- Path aliases: `@/*` maps to `./src/*`
- Imports: use `@/` alias for all internal imports
- Components: PascalCase filenames, default exports for pages, named exports for components
- shadcn/ui components in `src/components/ui/` use the convention from `components.json`
- ESLint (`eslint.config.mjs`) with Next.js config + Prettier plugin
- Prettier config in `.prettierrc.json`
- **Route colocation**: each route is a module — colocate its private implementation in `_`-prefixed folders inside the route directory: `_components/`, `_hooks/`, `_stores/`, `_actions/`, `_utils/`, `_schemas/`, `_constants/`, `_types/`, `_loaders/`. Next.js skips `_`-prefixed folders from routing, making routes visually distinct from implementation.

## Database Models (core)

Key models: `User`, `Task`, `Project`, `TaskList`, `TimeEntry`, `HourEntry`, `Shift`, `Request`, `Holiday`, `Notification`, `NotificationPreference`, `PushSubscription`, `VerificationToken`

## NFC Tap-In

`GET /api/tap-in` toggles work timer. Supports `?token=office|home` query param for hour type. Debug mode via `DEBUG_SKIP_URNIK_LOGIN=true`.
