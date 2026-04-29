# Time Management App

A modern team time management system for tracking work hours, managing tasks, scheduling shifts, and handling time-off requests with approval workflows. Built with Next.js and PostgreSQL.

## Features

**Hours Tracking** - Manual hour entry and automatic sync from task time tracking. Weekly/monthly calendar views with inline editing. Separate tracking of manual vs tracked hours.

**Task Management** - Hierarchical tasks with unlimited nesting, status tracking, and integrated start/stop timers. Organize tasks into color-coded lists.

**Time Tracker** - Simple dedicated interface for starting/stopping task timers with real-time elapsed time display.

**Time Sheets** - Comprehensive view of hours across time periods for reporting and payroll.

**Shift Scheduling** - Track daily work locations (Office, Home, Vacation, etc.) with visual calendar views showing all team members.

**Request Management** - Submit vacation, sick leave, and work-from-home requests with approval workflow. Full audit trail with automated notifications.

**Notifications** - Multi-channel notification system with in-app notifications center, email alerts, and browser push notifications. User-configurable preferences per event type.

**Holiday Calendar** - Company holiday management with recurring date support and automatic weekend detection.

**Admin Panel** - User management with role-based access (USER, ADMIN, GUEST), request approvals, holiday calendar management, and organizational oversight including viewing all team members' hours and time sheets.

**User Profile** - Personal settings including locale preference, theme selection, and notification preferences.

**Dark/Light Mode** - Toggle between dark and light themes with system preference detection and per-user persistence.

**Multi-language** - Full internationalization support (English & Slovenian) with user-specific locale preferences and no text flashing.

**PWA Support** - Installable as a Progressive Web App with service worker for push notifications.

## Technology Stack

- **Next.js** with App Router and React Server Components
- **PostgreSQL** database with Prisma ORM
- **NextAuth.js** for authentication (credentials + email verification)
- **TanStack Query** for server state and Zustand for client state
- **Tailwind CSS** with shadcn/ui components
- **next-intl** for internationalization
- **Zod** for validation

## Quick Start

**Prerequisites**: Node.js 18+, PostgreSQL database

```bash
# Install dependencies
npm install

# Set up environment variables (.env file)
DATABASE_URL="postgresql://user:password@localhost:5432/time_management"
NEXTAUTH_SECRET="your-secret-here"  # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# Database setup
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:seed        # Seed with test data

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with:

- Email: `demo@example.com`
- Password: `password123`

## Docker Deployment

Run the complete application stack with Docker (includes Next.js app, PostgreSQL, pgAdmin, Nginx):

```bash
# One command setup
./scripts/docker-setup.sh
```

**That's it!** The script will:

- Create `.env.docker` with Docker-specific configuration
- Generate secure secrets automatically
- Start all services (app, database, pgAdmin, nginx)

**Access the application:**

- Main app: http://localhost:6280
- pgAdmin: http://localhost:8888
- Default credentials: `demo@example.com` / `password123`

**For HTTPS/SSL:**
This setup uses HTTP only for simplicity. If you need HTTPS:

- Use Caddy, Traefik, or nginx reverse proxy
- Use Cloudflare Tunnel
- Use your domain's SSL termination

**Management commands:**

```bash
# View logs
docker compose logs -f app

# Update to latest version
./scripts/docker-update.sh

# Backup database
./scripts/docker-backup-db.sh

# Restore from backup
./scripts/docker-restore-db.sh backups/timeapp-20260211.sql

# Stop services
docker compose down

# Restart services
docker compose restart
```

**Full documentation:** [docs/DOCKER.md](docs/DOCKER.md)
