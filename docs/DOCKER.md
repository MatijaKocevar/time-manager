# Docker Deployment Guide

Complete guide for deploying the Time Management App using Docker.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Services Overview](#services-overview)
- [First-Time Setup](#first-time-setup)
- [Managing the Application](#managing-the-application)
- [Database Management](#database-management)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Updating](#updating)
- [Backup & Restore](#backup--restore)
- [Troubleshooting](#troubleshooting)
- [Production Considerations](#production-considerations)

## Prerequisites

- **Docker Engine**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **System Requirements**: 2GB RAM minimum, 4GB recommended
- **Disk Space**: At least 2GB free space

Verify installation:

```bash
docker --version
docker compose version
```

## Quick Start

Get the application running in 5 minutes:

```bash
# 1. Clone the repository (if not already done)
git clone <repository-url>
cd time-management-app

# 2. Copy environment files
cp .env.example .env
cp docker-compose.env.example docker-compose.env

# 3. Generate required secrets
./scripts/docker-generate-secrets.sh

# 4. Generate self-signed SSL certificate (for testing)
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# 5. Start all services
docker compose up -d

# 6. Check status
docker compose ps

# 7. View logs
docker compose logs -f app
```

Access the application:
- **Main App**: https://localhost (accept self-signed certificate warning)
- **pgAdmin**: http://localhost:5050
- **Direct App Access**: http://localhost:3000 (without Nginx)

Default credentials: `admin@example.com` / `Admin123!`

## Configuration

### Application Environment (.env)

Copy and configure [.env.example](.env.example) to `.env`:

```bash
cp .env.example .env
```

**Required Variables:**

```bash
# PostgreSQL connection (Docker)
DATABASE_URL="postgresql://timeapp:timeapp_password@db:5432/timeapp"

# NextAuth configuration
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"
NEXTAUTH_URL="https://yourdomain.com"

# Encryption key (for Urnik integration)
ENCRYPTION_KEY="<generate-with-npm-run-generate:encryption-key>"
```

**Generate Secrets:**

```bash
# Option 1: Use convenience script
./scripts/docker-generate-secrets.sh

# Option 2: Manual generation
# NEXTAUTH_SECRET
openssl rand -base64 32

# ENCRYPTION_KEY
docker compose run --rm app npm run generate:encryption-key
# Or if app not built yet:
npm install && npm run generate:encryption-key
```

**Optional Variables:**

```bash
# Email notifications (Resend)
RESEND_API_KEY="re_..."

# Push notifications (Web Push)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."

# Note: Pusher (real-time) not needed - Docker uses SSE fallback
```

### Docker Services Environment (docker-compose.env)

Copy and configure [docker-compose.env.example](docker-compose.env.example):

```bash
cp docker-compose.env.example docker-compose.env
```

**Default Configuration:**

```bash
# PostgreSQL
POSTGRES_USER=timeapp
POSTGRES_PASSWORD=timeapp_password
POSTGRES_DB=timeapp

# pgAdmin
PGADMIN_DEFAULT_EMAIL=admin@admin.com
PGADMIN_DEFAULT_PASSWORD=admin
```

**Production**: Change all default passwords!

## Services Overview

The Docker Compose setup includes 4 services:

### 1. app (Next.js Application)

- **Image**: Built from local Dockerfile
- **Port**: 3000
- **Dependencies**: PostgreSQL database
- **Auto-initialization**: Runs migrations and seeds demo data on first start
- **Health Check**: HTTP check on port 3000

### 2. db (PostgreSQL 16)

- **Image**: postgres:16-alpine
- **Port**: 5432
- **Data**: Persistent volume `timeapp-postgres-data`
- **Health Check**: `pg_isready` command

### 3. pgAdmin (Database UI)

- **Image**: dpage/pgadmin4:latest
- **Port**: 5050
- **Purpose**: Web-based PostgreSQL management
- **Access**: http://localhost:5050
- **Credentials**: From `docker-compose.env` (default: admin@admin.com/admin)

### 4. nginx (Reverse Proxy)

- **Image**: nginx:alpine
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Purpose**: SSL termination, static file caching, compression
- **Configuration**: [nginx/nginx.conf](nginx/nginx.conf)

## First-Time Setup

### Step 1: Environment Configuration

```bash
# Copy environment files
cp .env.example .env
cp docker-compose.env.example docker-compose.env

# Edit .env and set:
# - DATABASE_URL (use Docker PostgreSQL connection string)
# - NEXTAUTH_URL (your domain or https://localhost)
nano .env
```

### Step 2: Generate Secrets

```bash
# Use convenience script
chmod +x scripts/docker-generate-secrets.sh
./scripts/docker-generate-secrets.sh

# This generates:
# - NEXTAUTH_SECRET
# - ENCRYPTION_KEY
# And updates .env file automatically
```

### Step 3: SSL Certificate

**For Development/Testing:**

```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

**For Production:**

See [SSL/HTTPS Setup](#sslhttps-setup) section below.

### Step 4: Build and Start

```bash
# Build images and start services
docker compose up -d

# Watch startup logs
docker compose logs -f app

# Wait for "Starting Next.js server" message
```

### Step 5: Verify Installation

```bash
# Check all services are running
docker compose ps

# Should show all services as "Up (healthy)"
```

### Step 6: Access Application

1. Open https://localhost in browser
2. Accept self-signed certificate warning (development only)
3. Login with default credentials:
   - Email: `admin@example.com`
   - Password: `Admin123!`

**Important**: Change the admin password immediately after first login!

## Managing the Application

### Start Services

```bash
# Start all services
docker compose up -d

# Start specific service
docker compose up -d app

# Start with logs visible
docker compose up
```

### Stop Services

```bash
# Stop all services (keeps data)
docker compose down

# Stop and remove volumes (deletes all data)
docker compose down -v
```

### View Logs

```bash
# All services
docker compose logs

# Specific service
docker compose logs app
docker compose logs db

# Follow logs (real-time)
docker compose logs -f app

# Last 100 lines
docker compose logs --tail=100 app
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart app
```

### Execute Commands in Containers

```bash
# Access app container shell
docker compose exec app sh

# Run Prisma commands
docker compose exec app npx prisma migrate status
docker compose exec app npx prisma studio

# Access PostgreSQL CLI
docker compose exec db psql -U timeapp -d timeapp

# Generate new encryption key
docker compose exec app npm run generate:encryption-key
```

## Database Management

### Using pgAdmin

1. Access pgAdmin: http://localhost:5050
2. Login with credentials from `docker-compose.env`
3. Add server connection:
   - Name: timeapp
   - Host: db
   - Port: 5432
   - Database: timeapp
   - Username: timeapp
   - Password: (from docker-compose.env)

### Using CLI

```bash
# Connect to PostgreSQL
docker compose exec db psql -U timeapp -d timeapp

# Run SQL query
docker compose exec db psql -U timeapp -d timeapp -c "SELECT * FROM \"User\";"

# List databases
docker compose exec db psql -U timeapp -l
```

### Migrations

Migrations run automatically on container start. Manual operations:

```bash
# Check migration status
docker compose exec app npx prisma migrate status

# Create new migration (development)
docker compose exec app npx prisma migrate dev --name migration_name

# Apply migrations (production)
docker compose exec app npx prisma migrate deploy

# Reset database (deletes all data!)
docker compose exec app npx prisma migrate reset
```

### Seeding

Database auto-seeds on first start if empty. Manual seeding:

```bash
# Minimal seed (demo admin only)
docker compose exec app npx tsx prisma/seed/index.ts --minimal

# Full seed (test data)
docker compose exec app npx tsx prisma/seed/index.ts
```

### Refresh Materialized Views

```bash
# Refresh daily hour summaries
docker compose exec app node -e "require('./src/lib/materialized-views').refreshDailyHourSummary().then(() => process.exit(0))"
```

## SSL/HTTPS Setup

This Docker setup serves HTTP only for simplicity and flexibility.

### Why HTTP Only?

- **Simplicity**: No certificate management needed
- **Flexibility**: Users can choose their own SSL solution
- **Internal Networks**: Many users run on local/private networks
- **Reverse Proxy**: Easy to put behind Caddy, Traefik, or nginx

### Adding HTTPS (Your Choice)

**Option 1: Caddy (Easiest - Auto SSL)**
```yaml
# Add to docker-compose.yml
caddy:
  image: caddy:alpine
  ports:
    - "443:443"
  volumes:
    - ./Caddyfile:/etc/caddy/Caddyfile
    - caddy_data:/data
```

```caddyfile
# Caddyfile
yourdomain.com {
    reverse_proxy nginx:80
}
```

**Option 2: Cloudflare Tunnel**
```bash
# Zero-config SSL with Cloudflare
docker run cloudflare/cloudflared:latest tunnel --no-autoupdate run --token YOUR_TOKEN
```

**Option 3: nginx with Let's Encrypt**
Add certbot container and mount certificates into nginx - see [Certbot Docker docs](https://hub.docker.com/r/certbot/certbot/).

**Option 4: Use Your Domain Provider's SSL**
Many providers offer SSL termination at the edge (Cloudflare, AWS CloudFront, etc.).

## Updating

### Update Application Code

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose up -d --build

# View logs to ensure successful start
docker compose logs -f app
```

### Update Docker Images

```bash
# Pull latest base images
docker compose pull

# Rebuild with updated base images
docker compose up -d --build
```

### Update Database Schema

After pulling code with new migrations:

```bash
# Migrations run automatically on container restart
docker compose restart app

# Or manually trigger
docker compose exec app npx prisma migrate deploy
```

## Backup & Restore

### Backup Database

```bash
# Use convenience script
./scripts/docker-backup-db.sh

# Or manually
docker compose exec db pg_dump -U timeapp -d timeapp > backup-$(date +%Y%m%d).sql

# Backup to compressed file
docker compose exec db pg_dump -U timeapp -d timeapp | gzip > backup-$(date +%Y%m%d).sql.gz
```

### Restore Database

```bash
# Use convenience script
./scripts/docker-restore-db.sh backup-20260209.sql

# Or manually
# 1. Stop application
docker compose stop app

# 2. Drop and recreate database
docker compose exec db psql -U timeapp -c "DROP DATABASE IF EXISTS timeapp;"
docker compose exec db psql -U timeapp -c "CREATE DATABASE timeapp;"

# 3. Restore backup
cat backup-20260209.sql | docker compose exec -T db psql -U timeapp -d timeapp

# 4. Start application
docker compose start app
```

### Backup Volumes

```bash
# Create backup of all volumes
docker run --rm \
  -v timeapp-postgres-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres-volume-backup.tar.gz -C /data .
```

## Troubleshooting

### Containers Not Starting

```bash
# Check container status
docker compose ps

# View logs for errors
docker compose logs app
docker compose logs db

# Check health status
docker inspect timeapp-app | grep -A 10 Health
```

### Database Connection Errors

```bash
# Verify PostgreSQL is running
docker compose ps db

# Check database logs
docker compose logs db

# Test connection from app container
docker compose exec app node -e "
const { PrismaClient } = require('./prisma/generated/client');
new PrismaClient().\$connect()
  .then(() => console.log('Connected'))
  .catch(err => console.error('Error:', err));
"

# Verify DATABASE_URL in .env matches docker-compose.env credentials
```

### Migration Errors

```bash
# Check migration status
docker compose exec app npx prisma migrate status

# View failed migration details
docker compose logs app | grep -A 20 "migration"

# Reset migrations (deletes all data!)
docker compose exec app npx prisma migrate reset

# Manually apply specific migration
docker compose exec app npx prisma migrate resolve --applied "20260209_migration_name"
```

### Port Conflicts

If ports 80, 443, 3000, 5050, or 5432 are in use:

```bash
# Find process using port
sudo lsof -i :3000

# Update docker-compose.yml to use different ports:
ports:
  - "8080:3000"  # Access app on port 8080 instead
```

### Permission Errors

```bash
# Fix ownership of volumes
docker compose down
sudo chown -R $USER:$USER nginx/ssl
docker compose up -d
```

### SSL Certificate Issues

```bash
# Verify certificate exists
ls -la nginx/ssl/

# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Regenerate self-signed certificate
rm nginx/ssl/*.pem
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

docker compose restart nginx
```

### Application Not Accessible

```bash
# Check all services healthy
docker compose ps

# Test direct app access (bypass Nginx)
curl http://localhost:3000

# Check Nginx configuration
docker compose exec nginx nginx -t

# View Nginx logs
docker compose logs nginx
```

### Out of Memory

```bash
# Check container resource usage
docker stats

# Increase Docker resources in Docker Desktop settings
# Or add limits in docker-compose.yml:
services:
  app:
    mem_limit: 1g
    mem_reservation: 512m
```

### Clean Slate (Start Fresh)

```bash
# Stop and remove everything (including data)
docker compose down -v

# Remove all images
docker compose down --rmi all

# Start from scratch
docker compose up -d --build
```

## Production Considerations

### Security Hardening

1. **Change Default Passwords**
   ```bash
   # Update docker-compose.env
   POSTGRES_PASSWORD=<strong-random-password>
   PGADMIN_DEFAULT_PASSWORD=<strong-random-password>
   ```

2. **Use Secrets Management**
   - Use Docker Secrets or external secret management (Vault, AWS Secrets Manager)
   - Never commit `.env` or `docker-compose.env` to version control

3. **Restrict Network Access**
   ```yaml
   # docker-compose.yml: Remove port exposure for internal services
   services:
     db:
       # Remove or comment out:
       # ports:
       #   - "5432:5432"
   ```

4. **Enable Firewall**
   ```bash
   # Only allow HTTPS traffic
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

### Performance Optimization

1. **Database Connection Pooling**
   ```bash
   # .env - adjust pool size for your workload
   DATABASE_URL="postgresql://user:pass@db:5432/timeapp?connection_limit=20"
   ```

2. **Nginx Caching**
   - Already configured in [nginx/nginx.conf](nginx/nginx.conf)
   - Static assets cached for 365 days
   - Enable additional caching if needed

3. **Resource Limits**
   ```yaml
   # docker-compose.yml
   services:
     app:
       deploy:
         resources:
           limits:
             cpus: '2'
             memory: 2G
           reservations:
             memory: 512M
   ```

### Monitoring

1. **Health Checks**
   - Already configured in docker-compose.yml
   - Monitor with: `docker compose ps`

2. **Logs Aggregation**
   ```bash
   # Use Docker logging driver
   # docker-compose.yml
   services:
     app:
       logging:
         driver: "json-file"
         options:
           max-size: "10m"
           max-file: "3"
   ```

3. **Metrics Collection**
   - Consider adding Prometheus + Grafana
   - Or use external monitoring (DataDog, New Relic)

### Backup Strategy

1. **Automated Backups**
   ```bash
   # Add to crontab
   0 2 * * * /path/to/scripts/docker-backup-db.sh
   ```

2. **Off-site Backups**
   ```bash
   # Upload to S3, rsync to remote server, etc.
   aws s3 cp backup-$(date +%Y%m%d).sql.gz s3://your-bucket/backups/
   ```

3. **Test Restores Regularly**
   ```bash
   # Verify backups work monthly
   ./scripts/docker-restore-db.sh latest-backup.sql
   ```

### High Availability

For production environments requiring high availability:

1. Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
2. Run multiple app containers behind a load balancer
3. Consider Kubernetes for orchestration
4. Implement blue-green or rolling deployments

### Environment-Specific Configurations

```bash
# Production
docker-compose.prod.yml

# Staging
docker-compose.staging.yml

# Usage
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Support

For issues or questions:
- Check [Troubleshooting](#troubleshooting) section
- Review Docker logs: `docker compose logs`
- Open an issue in the repository

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
