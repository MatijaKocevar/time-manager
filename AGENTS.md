# AGENTS.md — Time Manager

> **Rules of engagement** — never `git commit`, `git push`, `npm run build`, run migrations (`db:migrate`, `db:migrate:deploy`, `db:push`, `db:reset`), or the deploy/cron scripts unless the user explicitly asks. Confirm first, even when the change looks "ready". This applies to the repo as a whole, not just the file you're editing.

Team time management system: hour tracking, nested tasks with timers, shifts, time-off requests with approvals, notifications, admin. Single Next.js App Router app + PostgreSQL.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Stack (newer than typical training data — verify behavior)

| Layer    | Choice                                                  | Notes                                                        |
| -------- | ------------------------------------------------------- | ------------------------------------------------------------ |
| App      | Next.js 16 App Router + React 19, TypeScript 6 (strict) | React Compiler on, `output: "standalone"`                    |
| Data     | PostgreSQL + Prisma 7                                   | `@prisma/adapter-pg`; generated client in `prisma/generated` |
| Auth     | NextAuth.js **v4** (not v5)                             | credentials + email verification, Prisma adapter, JWT        |
| State    | TanStack Query (server) + Zustand (client)              | query keys per route in `_constants/query-keys.ts`           |
| UI       | Tailwind CSS 4 + shadcn/ui (`new-york`, Radix, lucide)  | primitives in `src/components/ui/`                           |
| i18n     | next-intl (en, sl)                                      | cookie locale; both message files must stay in sync          |
| Forms    | React Hook Form + Zod 4                                 | server actions validate the same schemas                     |
| Realtime | SSE (`src/lib/sse-manager.ts`), Pusher as fallback      | tracker broadcasts                                           |
| Notify   | Resend (email) + web-push                               | dispatcher in `src/features/notifications/lib/notify.ts`     |

## Commands

```bash
npm run dev            # scripts/dev-https.sh: next dev --hostname 0.0.0.0, HTTPS if certs/ exists
npm run dev:https      # next dev --hostname 0.0.0.0 directly
npm run build          # next build (standalone output)
npm run lint           # eslint (flat config; there is NO `next lint`)
npx tsc --noEmit       # typecheck — no npm script exists for this
npm run format         # prettier --write .
npm run format:check   # prettier --check . (CI)

npm run db:generate    # prisma generate -> prisma/generated/client (also runs on postinstall)
npm run db:migrate     # prisma migrate dev (schema changes)
npm run db:seed        # seed test data (prisma/seed/index.ts); db:seed:minimal for a minimal set
npm run db:studio      # Prisma Studio
# also: db:push, db:migrate:deploy, db:reset, db:reset:minimal, db:clear, db:seed:test-user

npm run build:cron     # esbuild-bundle scripts/*-cron.ts -> scripts/build/*.js (PM2 runs these in prod)
npm run deploy         # PM2 deploy over SSH (hardcoded server); deploy:migrate also migrates
```

- Seeded login: `admin@example.com` / `password123`.
- Local HTTPS needs certs at `certs/key.pem` + `certs/cert.pem` (`mkcert -install && mkcert time-manager.home`); app is served at `https://time-manager.home:3000` (`allowedDevOrigins`).
- Docker: `./scripts/docker-setup.sh` → app `:6280`, pgAdmin `:8888`, Postgres `:54320`; details in `docs/DOCKER.md`.
- **There is no test runner** (`tests/` is empty). Verify changes with `npx tsc --noEmit`, `npm run lint`, and manual checks.

## Architecture

```
src/app/                     # routes only
  (protected)/<route>/       # auth-gated route modules (layout.tsx redirects to /login)
    _actions/                # server actions ("use server")
    _components/             # components only, one per file
    _hooks/                  # client logic/hooks
    _stores/                 # Zustand: state + raw setters only
    _schemas/                # Zod schemas
    _constants/              # incl. query-keys.ts
    _utils/ _types/ _loaders/
  api/                       # route handlers ONLY for integration/external endpoints
src/features/<feature>/      # cross-route features (sidebar, theme, notifications, export, ...)
src/components/ui/           # shadcn/ui primitives (Radix)
src/lib/                     # framework-free infra (prisma, auth, sse-manager, materialized-views, validation)
messages/                    # en.json + sl.json
prisma/                      # schema, migrations, seed; generated/ and database/ are gitignored
scripts/                     # dev/deploy/docker/cron helper scripts
```

- Route folders are modules: one file per concern, no mixed kinds. Feature/route public API is exported via `index.ts` barrels (`_`-prefixed folders are skipped by Next routing, which is why implementation lives there).
- **Server actions** (`_actions/`, split by concern, named exports) are used for virtually all mutations. `/api/*` handlers exist only where an external caller needs them (tap-in, SSE tracker, uploads, health, internal cron, pusher, NextAuth).
- **Reads** happen in server components, server actions, or `_loaders/` (plain `async` functions, no `"use server"`, used mainly in admin). TanStack Query consumes them client-side.
- **Writes must never run in server components or layouts** — only in server actions or API routes.

### Server action rules

- Auth first: `requireAuth()` / `requireAdmin()` from `@/lib/auth-helpers` (use `requireNotDemo(userId)` for destructive features on demo accounts).
- Validate input with `validateInput(schema, input)` from `@/lib/validation` (or `schema.safeParse`); all action inputs are Zod.
- Wrap related writes in `prisma.$transaction`; `revalidatePath()` affected routes after writes.
- Return `{ success: true }` or `{ error: string }` for expected failures — never throw for those.

### Client state rules

- Zustand stores are **pure state holders** — state + raw setters, no logic. Always select: `useStore((s) => s.value)`, never destructure.
- All logic (mutations, derived values, handlers, init effects) lives in `_hooks/use-*.ts`; components are JSX only.
- Loading/error/form state belongs in the store, not component `useState`.

### i18n rules

- Never hardcode user-facing text. Add every key to **both** `messages/en.json` and `messages/sl.json`.
- Server Components/loaders: `getTranslations()`. Client Components: `useTranslations()` (both are common here).
- Locale is cookie-based (`NEXT_LOCALE`, set in `src/proxy.ts`); request config in `src/features/locale/request.ts`.

### Typing & naming

- Zod schemas over interfaces (use `z.infer`); interfaces are only for Zustand state/actions and component props.
- No `any`, no non-null assertions (`!`), no comments — write self-documenting code.
- kebab-case filenames, PascalCase components, named exports for components, default exports for pages.

## Code style

Formatting is enforced by **Prettier** (`.prettierrc.json`: 4-space indent, width 100, **no semicolons**, double quotes, trailing commas `es5`). Run `npm run format` before committing; don't hand-format. `npm run format:check` is the CI gate.

Treat code like prose: group statements that belong together into **blocks**, and separate blocks with **one blank line**. Don't run everything together, and never use two blank lines.

- **Imports are one contiguous block** — no blank lines between them. The only blank line is after the `"use client"` / `"use server"` directive, and after the last import (before the first declaration).
- Blank line between top-level declarations (types, helpers, functions).
- Inside a function, blank lines between the major paragraphs: state/hook setup → the operation (setup → work → result) → the `return`.
- Statements that do one thing stay together with no blank lines (e.g. a group of `useState` calls).
- `try {` / `} finally {` / `} catch {` stay tight to their content; blank lines go _inside_ the block between its paragraphs, not right after `{`.

```ts
"use client"

import { useState } from "react"
import { doThing } from "@/lib/thing"

type Args = { id: string }

export function useSomething() {
    const [pending, setPending] = useState(false)
    const [done, setDone] = useState(false)

    async function run(args: Args) {
        setPending(true)

        try {
            const data = new FormData()

            data.append("id", args.id)

            await doThing(data)

            setDone(true)
        } finally {
            setPending(false)
        }
    }

    return { run, pending, done }
}
```

## Gotchas (do NOT regress these)

- **Next 16 async APIs**: `params`, `searchParams`, `cookies()`, `headers()` are Promises — `await` them. Middleware is `src/proxy.ts` (default-export `proxy`), not `middleware.ts`.
- **Prisma 7**: the client is generated to `prisma/generated/client` (gitignored) — run `npm run db:generate` after schema changes. `src/lib/prisma.ts` is the only client instance (pg adapter). There is no alias for the generated client; imports use relative paths such as `@/../../prisma/generated/client`.
- `DailyHourSummary` is a Postgres **MATERIALIZED VIEW** (`previewFeatures = ["views"]`). After any hour write, refresh it via `refreshDailyHourSummary()` / `refreshDailyHourSummaryInTransaction(tx)` from `@/lib/materialized-views`, or reads return stale totals.
- **NextAuth v4, not v5**: `getServerSession(authConfig)`, `getToken` from `next-auth/jwt`, roles are `USER` / `ADMIN` on `session.user.role`. Email verification uses the `VerificationToken` model + Resend.
- Migration baseline (`prisma/migrations/20260503000000_initial_setup`) must keep the full schema. Use `npm run db:migrate` for changes; `migrate deploy` on servers. Never regenerate a baseline while the local DB already has tables.
- React Compiler is enabled — avoid manual memoization unless profiling shows a need.
- Demo accounts are gated with `requireNotDemo()`; `/demo` exists.

## Environment & services

- Copy `.env.example` → `.env`. Required: `DATABASE_URL` (PostgreSQL), `NEXTAUTH_SECRET`. Seeded login only works after `npm run db:seed`.
- Optional: `RESEND_API_KEY` (email), `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` (push), `URNIK_TENANT_ID`, `CRON_SECRET`, `PUSHER_*` (Vercel alternate to SSE), `UPLOAD_BASE_PATH` (persistent uploads). `DEBUG_SKIP_URNIK_LOGIN=true` skips urnik.net during dev.
- NFC tap-in: `GET /api/tap-in` toggles the work timer; `?token=office` → WORK, `?token=home` → WORK_FROM_HOME.
- **Prod runs Docker on `server@192.168.0.10`** (hostname `server-asus`, SSH key auth from the dev machine), checkout at `/home/server/Documents/time-manager`. Update with `./scripts/deploy-docker.sh` (SSH → `git pull origin master` → rebuild + restart; `--backup` dumps the DB first, `--no-build` restarts only). The container entrypoint runs `prisma migrate deploy`, a minimal seed, and refreshes `daily_hour_summary` on every start. Live ports: nginx `:6280`, pgAdmin `:8888`, Postgres `:54320`.
- The PM2 setup (`ecosystem.config.js`, `npm run deploy` → `scripts/deploy.sh`, cron apps) is **legacy/dormant** (`pm2 list` is empty, `/home/server/time-management-app`); don't use it to update the live server.

> `.github/copilot-instructions.md` contains older, partly stale guidance (e.g. SQLite, API-route avoidance, i18n prop-drilling). Prefer this file when they conflict.
