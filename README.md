# Time Management App

A comprehensive time management system built with Next.js 14+ that enables teams to track work hours, manage tasks with hierarchical structures, schedule shifts, and handle time-off requests with an approval workflow.

## Features

### 📊 Hours Tracking

- Manual hour entry by date and type (Work, Vacation, Sick Leave, Work From Home, Other)
- Automatic sync from task time tracking
- Weekly and monthly calendar views with editable cells
- Separate tracking of manual vs tracked hours with combined totals

### ✅ Task Management

- Hierarchical task structure with unlimited subtask nesting
- Drag & drop ordering with visual feedback
- Status tracking (Todo, In Progress, Done, Blocked)
- Integrated time tracking with start/stop timers
- Time tracked on tasks syncs to Hours view

### 📅 Shift Management

- Daily work location tracking (Office, Home, Vacation, Sick Leave, Other)
- Visual monthly calendar with shift indicators
- Quick entry with notes support

### 📝 Request Management

- Multiple request types (Vacation, Sick Leave, Work From Home, Remote Work, Other)
- Approval workflow with pending, approved, rejected, and cancelled states
- Admin interface for managing requests and viewing history
- Full audit trail with timestamps and reasons
- Support for multi-day requests

### 👥 User Management (Admin)

- Role-based access control (USER and ADMIN roles)
- User account creation and management
- Organization-wide request oversight

## Technology Stack

- **Framework**: [Next.js 14+](https://nextjs.org) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org) (strict mode)
- **Database**: [PostgreSQL](https://www.postgresql.org) with [Prisma ORM](https://www.prisma.io)
- **Authentication**: [NextAuth.js v4](https://next-auth.js.org) with credentials provider
- **State Management**:
    - [TanStack Query v5](https://tanstack.com/query) for server state
    - [Zustand](https://zustand-demo.pmnd.rs) for client UI state
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **Validation**: [Zod](https://zod.dev) schemas for runtime validation
- **UI Components**: [Radix UI](https://www.radix-ui.com) primitives
- **Icons**: [Lucide React](https://lucide.dev)

## Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn package manager

## Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd time-management-app
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/time_management"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

Generate a secure `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations (creates tables)
npm run db:migrate

# Seed with initial data (creates admin user)
npm run db:seed
```

**Default Admin Credentials** (after seeding):

- Email: `admin@example.com`
- Password: `admin123` (change after first login)

### 4. Run Development Server

```bash
# Standard HTTP
npm run dev

# HTTPS (requires certificates in certs/ folder)
npm run dev:https
```

Open [http://localhost:3000](http://localhost:3000) and log in with the admin credentials.

## Available Scripts

| Script                      | Description                             |
| --------------------------- | --------------------------------------- |
| `npm run dev`               | Start development server (HTTP)         |
| `npm run dev:https`         | Start development server with HTTPS     |
| `npm run build`             | Build for production                    |
| `npm run start`             | Start production server                 |
| `npm run lint`              | Run ESLint                              |
| `npm run db:generate`       | Generate Prisma client                  |
| `npm run db:push`           | Push schema changes without migration   |
| `npm run db:migrate`        | Create and run new migration            |
| `npm run db:migrate:deploy` | Deploy migrations (production)          |
| `npm run db:seed`           | Seed database with initial data         |
| `npm run db:reset`          | Reset database (⚠️ destructive)         |
| `npm run db:studio`         | Open Prisma Studio (visual DB browser)  |
| `npm run dev:db`            | Push schema, seed, and start dev server |

## Project Structure

```
src/
├── app/
│   ├── (protected)/              # Authenticated routes
│   │   ├── hours/                # Hours tracking module
│   │   │   ├── actions/          # Server actions (CRUD)
│   │   │   ├── components/       # Feature components
│   │   │   ├── schemas/          # Zod validation schemas
│   │   │   ├── utils/            # Helper functions
│   │   │   └── page.tsx          # Route page
│   │   ├── tasks/                # Task management module
│   │   ├── tracker/              # Time tracking interface
│   │   ├── shifts/               # Shift scheduling module
│   │   ├── requests/             # Request management
│   │   └── admin/                # Admin features
│   ├── api/auth/                 # NextAuth API routes
│   └── login/                    # Login page
├── components/
│   └── ui/                       # Shared shadcn/ui components
├── lib/
│   ├── auth.ts                   # NextAuth configuration
│   ├── prisma.ts                 # Prisma client singleton
│   └── utils.ts                  # Utility functions
├── features/                     # Cross-feature modules
│   ├── breadcrumbs/              # Breadcrumb navigation
│   └── sidebar/                  # Application sidebar
├── stores/                       # Zustand stores
└── types/                        # Shared TypeScript types

prisma/
├── schema.prisma                 # Database schema definition
├── migrations/                   # Migration history
└── seed/                         # Database seeding scripts
```

## Database Schema

- **User**: Authentication and role management
- **Task**: Hierarchical task structure
- **TaskTimeEntry**: Time tracking entries
- **HourEntry**: Manual hour entries
- **DailyHourSummary**: Daily hour totals
- **Request**: Time-off requests with approval workflow
- **Shift**: Daily work location tracking

## Development Guidelines

For detailed development standards and patterns, see `.github/copilot-instructions.md`.

Key principles:

- Strict TypeScript with no `any` types
- Zod validation for all external input
- Server Components by default
- Feature-based folder organization

## Authentication & Authorization

### Role-Based Access

- **USER**: Access hours, tasks, tracker, shifts, and own requests
- **ADMIN**: All USER features + user management + request approvals

### Session Management

NextAuth.js with JWT-based sessions:

- Credentials provider with bcrypt password hashing
- Session verification via `requireAuth()` helper
- Protected routes under `(protected)/` layout

## Deployment

### Environment Variables

Ensure these are set in your production environment:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Cryptographically secure random string
- `NEXTAUTH_URL`: Your production domain (e.g., `https://yourdomain.com`)

### Migration Workflow

```bash
# Production migration deployment
npm run db:migrate:deploy
```

### Build & Deploy

```bash
npm run build
npm run start
```

Platform-specific deployment guides:

- [Vercel](https://vercel.com/docs)
- [Railway](https://docs.railway.app)
- [Docker](https://docs.docker.com)

## Troubleshooting

### Database Connection Issues

Check your `DATABASE_URL` format:

```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

### Migration Conflicts

Reset and reseed (⚠️ development only):

```bash
npm run db:reset
```

### Prisma Client Out of Sync

Regenerate the client:

```bash
npm run db:generate
```

### View Database

Open Prisma Studio for visual inspection:

```bash
npm run db:studio
```

## Contributing

1. Follow the code quality standards in `.github/copilot-instructions.md`
2. Use feature-based folder organization
3. Write type-safe code with Zod schemas
4. Test mutations with proper error handling
5. Ensure all TypeScript errors are resolved before committing

## License

This project is private and proprietary.
