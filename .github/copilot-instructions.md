# GitHub Copilot Instructions

## General Workflow

**CRITICAL: Always check package.json for available scripts before running commands**

- **ALWAYS** check package.json scripts section before running npm/yarn commands
- **NEVER** assume command names - verify they exist in package.json first
- Use the exact script name as defined in package.json
- If unsure about a command, read package.json scripts first

## Git Workflow

**CRITICAL: Never commit or push changes unless explicitly requested by the user**

- **NEVER** run `git commit` or `git push` automatically after making changes
- **ONLY** commit and push when the user specifically says "commit and push" or similar explicit instruction
- Making code changes does NOT imply committing them
- Let the user decide when changes are ready to be committed

### Commit Message Format

**CRITICAL: Always use conventional commits format with proper capitalization**

- **ALWAYS** use conventional commit format: `type: Description`
- **ALWAYS** capitalize the first letter after the colon: `feat: Add feature` not `feat: add feature`
- Use these commit types:
  - `feat:` - New features
  - `fix:` - Bug fixes
  - `perf:` - Performance improvements
  - `refactor:` - Code refactoring
  - `docs:` - Documentation changes
  - `style:` - Code style changes (formatting, no logic changes)
  - `test:` - Adding or updating tests
  - `chore:` - Maintenance tasks
- Keep commit messages clear and descriptive
- Use imperative mood: "Add feature" not "Added feature" or "Adds feature"

## Code Quality Standards

### TypeScript Requirements

- Never use `any` types - always provide explicit, strict typing
- Never use non-null assertions (`!`) - handle null/undefined cases explicitly
- Use proper TypeScript interfaces and type definitions
- Prefer `unknown` over `any` when type is uncertain
- Use generic types and constraints where appropriate

### Code Style

- No comments in code - write self-documenting, clear code
- Use descriptive variable and function names
- Prefer functional programming patterns where applicable
- Use modern ES6+ syntax and React patterns
- Never use emojis in console logs, code, or any output - use plain text only

## Internationalization (i18n) with next-intl

### Translation Requirements

**CRITICAL: Always create translations when creating or updating components**

- **NEVER** hardcode user-facing text in components
- **ALWAYS** use translation keys via `getTranslations()` (Server Components) or pass translations as props
- **ALWAYS** add translations to BOTH `messages/en.json` AND `messages/sl.json` simultaneously
- Use descriptive, hierarchical translation keys following existing patterns
- **AVOID** `useTranslations()` hook in Client Components - causes text flashing

### Translation Setup

**Configuration:**

- i18n library: `next-intl`
- Supported locales: `en` (English), `sl` (Slovenščina/Slovenian)
- Default locale: `en`
- Translation files: `messages/en.json`, `messages/sl.json`
- Config: `src/i18n/config.ts`

**Key Structure Pattern:**

```json
{
    "moduleName": {
        "componentName": {
            "element": "Translation text"
        }
    }
}
```

### Using Translations in Components

**IMPORTANT: Always prefer Server Components for translations to avoid text flashing**

Using `useTranslations()` hook in Client Components causes the text to initially render in English, then shift to the correct language after hydration. This creates a poor user experience.

**Server Components (PREFERRED):**

```typescript
import { getTranslations } from "next-intl/server"

export default async function MyPage() {
    const t = await getTranslations("moduleName.componentName")

    return <h1>{t("title")}</h1>
}
```

**Client Components with Server-Rendered Text (BEST PRACTICE):**
Pass translations as props from Server Component to avoid text flashing:

```typescript
// Server Component (page.tsx)
import { getTranslations } from "next-intl/server"
import { InteractiveButton } from "./interactive-button"

export default async function MyPage() {
    const t = await getTranslations("moduleName.componentName")

    return (
        <InteractiveButton
            label={t("submitButton")}
            successMessage={t("successMessage")}
        />
    )
}

// Client Component
"use client"
interface InteractiveButtonProps {
    label: string
    successMessage: string
}

export function InteractiveButton({ label, successMessage }: InteractiveButtonProps) {
    return <button onClick={() => alert(successMessage)}>{label}</button>
}
```

**Client Components with useTranslations (ONLY when Server Component not possible):**

```typescript
"use client"
import { useTranslations } from "next-intl"

// Only use this pattern when:
// - Component is deeply nested and prop drilling is impractical
// - Component needs dynamic translation keys based on runtime state
export function MyComponent() {
    const t = useTranslations("moduleName.componentName")

    return <button>{t("submitButton")}</button>
}
```

### Translation Key Naming Conventions

**Use existing common keys when available:**

- `common.actions.*` - Standard actions (save, cancel, delete, edit, etc.)
- `common.labels.*` - Common labels (name, email, date, status, etc.)
- `common.messages.*` - Common messages (success, error, loading, etc.)
- `common.validation.*` - Validation messages

**For feature-specific text, follow this hierarchy:**

```json
{
    "hours": {
        "page": { "title": "Hours" },
        "table": { "columnHeader": "Total Hours" },
        "dialog": { "createTitle": "Add Hours" },
        "form": { "dateLabel": "Date" }
    }
}
```

### Workflow for Adding Translations

1. **Identify all user-facing text** in your component
2. **Choose component type**: Prefer Server Component for translations
3. **Check `messages/en.json`** for existing common keys first
4. **If new keys needed:**
    - Add to `messages/en.json` with English text
    - Add to `messages/sl.json` with Slovenian text
    - Use descriptive, hierarchical key structure
5. **Import and use translations**:
    - Server Components: Use `getTranslations()` from "next-intl/server"
    - Client Components: Pass translations as props from parent Server Component
    - Last resort: Use `useTranslations()` hook if Server Component not possible
6. **Test language toggle** to verify both translations work without text flashing

### Examples

**Before (❌ Wrong - hardcoded text):**

```typescript
export function TaskCard() {
    return (
        <div>
            <h2>Task Details</h2>
            <button>Save</button>
        </div>
    )
}
```

**After (✅ Correct - Server Component with translations):**

```typescript
import { getTranslations } from "next-intl/server"

export async function TaskCard() {
    const t = await getTranslations("tasks.card")
    const tCommon = await getTranslations("common.actions")

    return (
        <div>
            <h2>{t("title")}</h2>
            <button>{tCommon("save")}</button>
        </div>
    )
}
```

**If interactivity needed (✅ Better - pass translations as props):**

```typescript
// Server Component wrapper
import { getTranslations } from "next-intl/server"
import { TaskCardClient } from "./task-card-client"

export async function TaskCard() {
    const t = await getTranslations("tasks.card")
    const tCommon = await getTranslations("common.actions")

    return (
        <TaskCardClient
            title={t("title")}
            saveLabel={tCommon("save")}
        />
    )
}

// Client Component
"use client"
interface TaskCardClientProps {
    title: string
    saveLabel: string
}

export function TaskCardClient({ title, saveLabel }: TaskCardClientProps) {
    return (
        <div>
            <h2>{title}</h2>
            <button onClick={() => console.log("save")}>{saveLabel}</button>
        </div>
    )
}
```

**Translation files:**

```json
// messages/en.json
{
  "tasks": {
    "card": {
      "title": "Task Details"
    }
  }
}

// messages/sl.json
{
  "tasks": {
    "card": {
      "title": "Podrobnosti naloge"
    }
  }
}
```

### Error Handling

- Never leave TypeScript errors or warnings
- Handle all possible error states explicitly
- Use proper error boundaries in React components
- Validate all external data with Zod schemas

## Architecture Patterns

### Next.js App Router

- Use Server Components for data loading by default
- Client Components only when interactivity is required
- Prefer Server Actions for mutations over API routes
- Use proper async/await patterns in Server Components

### State Management

- TanStack Query for server state management
- Zustand for client-side UI state (including loading, error, and form data)
- No custom hooks - use direct store access with selector pattern
- Always access store state with selectors: `useStore((state) => state.property)`
- Never destructure directly from store: `const { prop } = useStore()` ❌
- All loading states (`isLoading`) must be in Zustand stores, not in component `useState`
- All error states (`error`) must be in Zustand stores, not in component `useState`
- Feature-based folder organization

### Database and API

- Use Prisma for all database operations
- Server Actions for data mutations
- Proper error handling and validation
- Type-safe database queries

## File Organization

### Feature-Based Structure

- Keep related files together in feature folders
- Each feature should contain: components/, actions/, stores/, schemas/, query-keys.ts
- Avoid scattered files across different directories
- Co-locate tests with their corresponding files

### Type and Schema Organization

- Use Zod schemas instead of TypeScript interfaces for validation + types
- Feature-specific schemas go in `schemas/` folder (app/tasks/schemas/)
- Only general/shared types go in src/types/
- Derive TypeScript types from Zod schemas using z.infer
- Exceptions: TypeScript interfaces are allowed ONLY for:
    - Zustand store state and action definitions
    - React component props
- Each feature manages its own query keys in query-keys.ts

### Naming Conventions

- PascalCase for React components
- camelCase for functions and variables
- kebab-case for file names
- Descriptive, intention-revealing names

## React Patterns

### Component Design

- Prefer composition over inheritance
- Use proper prop typing with interfaces
- Implement proper loading and error states
- Use Suspense boundaries where appropriate

### Performance

- Use React Compiler optimizations
- Proper key props for list items
- Avoid unnecessary re-renders
- Use proper memoization patterns

## Security and Validation

### Input Validation

- Use Zod for all form validation
- Validate server action inputs
- Sanitize user inputs properly
- Use proper authentication checks

### Data Access

- Always verify user permissions
- Use proper session management
- Implement proper CSRF protection
- Follow principle of least privilege

## Project Architecture Overview

### Technology Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript with strict mode
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query (server state) + Zustand (client state)
- **Validation**: Zod schemas

### Application Structure

```
src/app/(protected)/          # Protected routes (requires authentication)
├── hours/                    # Hours tracking module
│   ├── actions/             # Server actions for CRUD operations
│   ├── components/          # Feature-specific components
│   ├── schemas/             # Zod schemas for validation
│   ├── utils/               # Helper functions
│   ├── scripts/             # One-time migration scripts
│   └── page.tsx             # Route page component
├── tasks/                    # Task management module
│   ├── actions/             # Server actions (CRUD + time tracking)
│   ├── components/          # Feature-specific components
│   ├── schemas/             # Zod schemas
│   └── page.tsx
├── tracker/                  # Time tracking interface
├── admin/                    # Admin features (user management)
└── layout.tsx               # Protected layout with sidebar

src/components/               # Shared UI components
├── ui/                      # shadcn/ui components
├── app-sidebar.tsx          # Navigation sidebar
└── SessionWrapper.tsx       # Auth session provider

src/lib/                     # Shared utilities
├── auth.ts                  # NextAuth configuration
├── prisma.ts                # Prisma client singleton
└── utils.ts                 # General utilities

prisma/
├── schema.prisma            # Database schema
├── migrations/              # Database migrations
└── seed/                    # Database seeding scripts
```

### Database Schema

**Core Models:**

- `User`: User accounts with role-based access (USER, ADMIN)
- `Task`: Task management with status tracking
- `TaskTimeEntry`: Time tracking entries for tasks (stores duration in seconds)
- `HourEntry`: Manual hour entries (taskId null for manual, set for task-linked)
- `DailyHourSummary`: Pre-computed daily totals (manualHours, trackedHours, totalHours)

**Key Relationships:**

- User → Tasks (one-to-many)
- User → TaskTimeEntries (one-to-many)
- User → HourEntries (one-to-many)
- User → DailyHourSummaries (one-to-many)
- Task → TaskTimeEntries (one-to-many)

### Data Flow Patterns

#### Server Actions (Preferred for Mutations)

All data mutations use Next.js Server Actions located in feature-specific `actions/` folders:

```typescript
// Example: src/app/(protected)/hours/actions/hour-actions.ts
"use server"

export async function createHourEntry(input: CreateHourEntryInput) {
    const session = await requireAuth()
    const validation = CreateHourEntrySchema.safeParse(input)

    await prisma.$transaction(async (tx) => {
        await tx.hourEntry.create({ data: { userId: session.user.id, ...data } })
        await recalculateDailySummary(tx, session.user.id, date, type)
    })

    revalidatePath("/hours")
    return { success: true }
}
```

**Server Action Guidelines:**

- Always validate input with Zod schemas
- Use `requireAuth()` to verify authentication
- Wrap related operations in Prisma transactions
- Call `revalidatePath()` to update cached data
- Return structured responses: `{ success: true }` or `{ error: "message" }`

#### Query Pattern with TanStack Query

```typescript
// Client component
const { data, isLoading, error } = useQuery({
    queryKey: hourKeys.list({ startDate, endDate }),
    queryFn: () => getHourEntries(startDate, endDate),
})

// Mutation with cache invalidation
const mutation = useMutation({
    mutationFn: createHourEntry,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: hourKeys.all })
    },
})
```

### Performance Optimization: DailyHourSummary Pattern

**Problem:** Original implementation calculated totals on every render by aggregating HourEntry and TaskTimeEntry records (O(n) complexity).

**Solution:** Materialized view pattern with DailyHourSummary table:

1. **Pre-computed Totals**: Store manualHours, trackedHours, and totalHours per user/date/type combination
2. **Transaction-Based Updates**: All write operations recalculate affected summaries:
    ```typescript
    await prisma.$transaction(async (tx) => {
        await tx.hourEntry.create({ data })
        await recalculateDailySummary(tx, userId, date, type)
    })
    ```
3. **O(1) Read Performance**: Query DailyHourSummary instead of aggregating:
    ```typescript
    const summaries = await prisma.dailyHourSummary.findMany({
        where: { userId, date: { gte: startDate, lte: endDate } },
    })
    ```

**Summary Calculation Logic** (in `src/app/(protected)/hours/utils/summary-helpers.ts`):

- manualHours: SUM(HourEntry.hours) WHERE taskId IS NULL
- trackedHours: SUM(TaskTimeEntry.duration / 3600) WHERE date range matches
- totalHours: manualHours + trackedHours

**When Summaries Update:**

- createHourEntry → recalculate for new date/type
- updateHourEntry → recalculate old AND new date/type if changed
- deleteHourEntry → recalculate for deleted entry's date/type
- stopTimer (task tracking) → recalculate for tracked date

### Hours Module Display Logic

The hours table shows three rows per hour type (WORK, VACATION, etc.):

1. **TOTAL Row** (read-only, bold): Shows totalHours from DailyHourSummary
2. **TRACKED Row** (read-only): Shows trackedHours from DailyHourSummary
3. **MANUAL Row** (editable): Fetches actual HourEntry records with real IDs

**Manual Entry Editing:**

- Clicking cell opens time picker with hours/minutes dropdowns
- Creates new entry if none exists (taskId = null)
- Updates existing entry using real database ID
- Time picker shows current value and saves on OK click

### Authentication & Authorization

**NextAuth.js Configuration** (`src/lib/auth.ts`):

- Credentials provider with bcrypt password hashing
- JWT-based sessions
- Role-based access control (USER, ADMIN)

**Session Verification Pattern:**

```typescript
async function requireAuth() {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
        throw new Error("Unauthorized")
    }
    return session
}
```

**Protected Routes:**

- All routes under `(protected)/` require authentication
- Layout enforces session check and shows sidebar navigation
- Admin-only pages verify user role

### UI Component Patterns

**shadcn/ui Components:**

- Import from `@/components/ui/*`
- Customizable via Tailwind classes
- Never modify component source - use className prop

**Table Components:**

- Use `Table`, `TableBody`, `TableCell`, etc. from shadcn/ui
- Implement sticky headers for scrollable tables
- Handle weekend highlighting, row colors, and cell editing

**Form Handling:**

- Use Zod schemas for validation
- Server actions for submission
- Display errors from server responses

### Zustand Store Pattern

**Store Location:** `src/stores/` (currently using minimal stores)

**Store Structure:**

```typescript
interface StoreState {
    isLoading: boolean
    error: string | null
    // ... state
}

interface StoreActions {
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    // ... actions
}

export const useStore = create<StoreState & StoreActions>((set) => ({
    isLoading: false,
    error: null,
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
}))
```

**Usage with Selectors:**

```typescript
// ✓ Correct - use selector
const isLoading = useStore((state) => state.isLoading)

// ✗ Wrong - no destructuring
const { isLoading } = useStore()
```

### Migration & Data Sync

**Creating Migrations:**

```bash
npx prisma migrate dev --name descriptive_name
```

**Syncing Existing Data:**

- Create sync script in `src/app/(protected)/[feature]/scripts/`
- Use `recalculateDailySummary` or similar functions
- Run with `npx tsx path/to/script.ts`
- Example: `sync-summaries.ts` populates DailyHourSummary from existing data

### Common Pitfalls to Avoid

1. **Don't use API routes** - Use Server Actions instead
2. **Don't calculate totals in components** - Query DailyHourSummary
3. **Don't forget transactions** - Wrap related DB operations
4. **Don't skip revalidatePath** - Cache won't update otherwise
5. **Don't destructure Zustand stores** - Use selectors always
6. **Don't use `any` types** - Strictly type everything
7. **Don't add comments** - Write clear, self-documenting code
8. **Don't forget Zod validation** - Validate all inputs

### Testing & Debugging

**Check Errors:**

- Use VS Code Problems panel for TypeScript errors
- All errors must be fixed before committing

**Database Inspection:**

```bash
npx prisma studio  # Visual database browser
```

**Query Logging:**

- Prisma queries logged to console in development
- Check terminal for SQL execution details

### Deployment Considerations

- Database migrations run automatically via Prisma
- Environment variables needed: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
- Static generation where possible, dynamic for protected routes
- Session cookies use secure settings in production
