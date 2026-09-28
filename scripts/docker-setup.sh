#!/bin/bash
set -e

echo "================================================"
echo "Time Management App - Docker Setup"
echo "================================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed"
    echo ""
    echo "Please install Docker first:"
    echo "  - Docker Desktop: https://www.docker.com/products/docker-desktop"
    echo "  - Or Docker Engine: https://docs.docker.com/engine/install/"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Error: Docker Compose is not available"
    echo ""
    echo "Please install Docker Compose or use Docker Desktop"
    exit 1
fi

echo "✓ Docker is installed"
echo ""

# Step 1: Setup environment files
echo "Step 1: Setting up environment files..."
echo ""

if [ ! -f .env.docker ]; then
    echo "  Creating .env.docker from .env.docker.example..."
    cp .env.docker.example .env.docker
    echo "  ✓ Created .env.docker"
else
    echo "  ✓ .env.docker already exists"
fi

echo ""

# Step 2: Generate secrets
echo "Step 2: Generating secrets..."
echo ""

NEXTAUTH_SECRET=$(grep "^NEXTAUTH_SECRET=" .env.docker | cut -d '=' -f2- | tr -d '"' | tr -d "'")
ENCRYPTION_KEY=$(grep "^ENCRYPTION_KEY=" .env.docker | cut -d '=' -f2- | tr -d '"' | tr -d "'")
CRON_SECRET=$(grep "^CRON_SECRET=" .env.docker | cut -d '=' -f2- | tr -d '"' | tr -d "'")

NEEDS_UPDATE=false

if [ -z "$NEXTAUTH_SECRET" ] || [ "$NEXTAUTH_SECRET" = "your-nextauth-secret-here" ]; then
    echo "  Generating NEXTAUTH_SECRET..."
    NEW_NEXTAUTH_SECRET=$(openssl rand -base64 32)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$NEW_NEXTAUTH_SECRET\"|" .env.docker
    else
        sed -i "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$NEW_NEXTAUTH_SECRET\"|" .env.docker
    fi
    echo "  ✓ Generated NEXTAUTH_SECRET"
    NEEDS_UPDATE=true
else
    echo "  ✓ NEXTAUTH_SECRET already configured"
fi

if [ -z "$ENCRYPTION_KEY" ] || [ "$ENCRYPTION_KEY" = "your-encryption-key-here" ]; then
    echo "  Generating ENCRYPTION_KEY..."
    NEW_ENCRYPTION_KEY=$(openssl rand -hex 32)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=\"$NEW_ENCRYPTION_KEY\"|" .env.docker
    else
        sed -i "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=\"$NEW_ENCRYPTION_KEY\"|" .env.docker
    fi
    echo "  ✓ Generated ENCRYPTION_KEY"
    NEEDS_UPDATE=true
else
    echo "  ✓ ENCRYPTION_KEY already configured"
fi

if [ -z "$CRON_SECRET" ] || [ "$CRON_SECRET" = "your-cron-secret-here" ]; then
    echo "  Generating CRON_SECRET..."
    NEW_CRON_SECRET=$(openssl rand -base64 32)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^CRON_SECRET=.*|CRON_SECRET=\"$NEW_CRON_SECRET\"|" .env.docker
    else
        sed -i "s|^CRON_SECRET=.*|CRON_SECRET=\"$NEW_CRON_SECRET\"|" .env.docker
    fi
    echo "  ✓ Generated CRON_SECRET"
    NEEDS_UPDATE=true
else
    echo "  ✓ CRON_SECRET already configured"
fi

POSTGRES_PASSWORD=$(grep "^POSTGRES_PASSWORD=" .env.docker | cut -d '=' -f2- | tr -d '"' | tr -d "'")
PGADMIN_DEFAULT_EMAIL=$(grep "^PGADMIN_DEFAULT_EMAIL=" .env.docker | cut -d '=' -f2- | tr -d '"' | tr -d "'")
PGADMIN_DEFAULT_PASSWORD=$(grep "^PGADMIN_DEFAULT_PASSWORD=" .env.docker | cut -d '=' -f2- | tr -d '"' | tr -d "'")

DB_VOLUME_EXISTS=false
if docker volume inspect timeapp-postgres-data >/dev/null 2>&1; then
    DB_VOLUME_EXISTS=true
fi

PGADMIN_VOLUME_EXISTS=false
if docker volume inspect timeapp-pgadmin-data >/dev/null 2>&1; then
    PGADMIN_VOLUME_EXISTS=true
fi

if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "change-me" ]; then
    if [ "$DB_VOLUME_EXISTS" = true ]; then
        echo "  ⚠ Database volume already exists but POSTGRES_PASSWORD is not set in .env.docker"
        echo "    Set it to the current database password (must match DATABASE_URL) and re-run."
        exit 1
    fi
    echo "  Generating POSTGRES_PASSWORD..."
    NEW_POSTGRES_PASSWORD=$(openssl rand -hex 24)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "/^POSTGRES_PASSWORD=/d" .env.docker
        sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=\"postgresql://timeapp:$NEW_POSTGRES_PASSWORD@db:5432/timeapp\"|" .env.docker
    else
        sed -i "/^POSTGRES_PASSWORD=/d" .env.docker
        sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"postgresql://timeapp:$NEW_POSTGRES_PASSWORD@db:5432/timeapp\"|" .env.docker
    fi
    echo "POSTGRES_PASSWORD=\"$NEW_POSTGRES_PASSWORD\"" >> .env.docker
    echo "  ✓ Generated POSTGRES_PASSWORD"
    NEEDS_UPDATE=true
else
    echo "  ✓ POSTGRES_PASSWORD already configured"
fi

if [ -z "$PGADMIN_DEFAULT_PASSWORD" ] || [ "$PGADMIN_DEFAULT_PASSWORD" = "change-me" ]; then
    if [ "$PGADMIN_VOLUME_EXISTS" = true ]; then
        echo "  ⚠ pgAdmin volume already exists but PGADMIN_DEFAULT_PASSWORD is not set in .env.docker"
        echo "    Set it to the current pgAdmin password and re-run."
        exit 1
    fi
    echo "  Generating PGADMIN_DEFAULT_PASSWORD..."
    NEW_PGADMIN_PASSWORD=$(openssl rand -hex 16)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "/^PGADMIN_DEFAULT_PASSWORD=/d" .env.docker
    else
        sed -i "/^PGADMIN_DEFAULT_PASSWORD=/d" .env.docker
    fi
    echo "PGADMIN_DEFAULT_PASSWORD=\"$NEW_PGADMIN_PASSWORD\"" >> .env.docker
    echo "  ✓ Generated PGADMIN_DEFAULT_PASSWORD (see .env.docker)"
    NEEDS_UPDATE=true
else
    echo "  ✓ PGADMIN_DEFAULT_PASSWORD already configured"
fi

if [ -z "$PGADMIN_DEFAULT_EMAIL" ]; then
    if [ "$PGADMIN_VOLUME_EXISTS" = true ]; then
        echo "  ⚠ pgAdmin volume already exists but PGADMIN_DEFAULT_EMAIL is not set in .env.docker"
        echo "    Set it to the current pgAdmin login email and re-run."
        exit 1
    fi
    echo "  Setting PGADMIN_DEFAULT_EMAIL..."
    echo "PGADMIN_DEFAULT_EMAIL=\"admin@example.com\"" >> .env.docker
    echo "  ✓ Set PGADMIN_DEFAULT_EMAIL"
    NEEDS_UPDATE=true
else
    echo "  ✓ PGADMIN_DEFAULT_EMAIL already configured"
fi

if [ "$NEEDS_UPDATE" = false ]; then
    echo "  ✓ All secrets already configured"
fi

echo ""

# Step 2: Configuration complete
echo "Step 2: Configuration complete..."
echo ""

# Step 3: Start Docker containers
echo "Step 3: Starting Docker containers..."
echo ""
echo "  This may take a few minutes on first run..."
echo ""

docker compose --env-file .env.docker up -d

echo ""
echo "================================================"
echo "✓ Setup Complete!"
echo "================================================"
echo ""
echo "Your Time Management App is now running!"
echo ""
echo "Access the application:"
echo "  • Main App:  http://localhost:6280"
echo "  • pgAdmin:   http://localhost:8888"
echo "  • Database:  localhost:54320"
echo ""
echo "Default login credentials:"
echo "  • Email:     admin@example.com"
echo "  • Password:  password123"
echo ""
echo "pgAdmin login: see PGADMIN_DEFAULT_EMAIL / PGADMIN_DEFAULT_PASSWORD in .env.docker"
echo ""
echo "Useful commands:"
echo "  • View logs:        docker compose --env-file .env.docker logs -f app"
echo "  • Update app:       ./scripts/docker-update.sh"
echo "  • Stop containers:  docker compose --env-file .env.docker down"
echo "  • Restart:          docker compose --env-file .env.docker restart"
echo "  • Remove all:       docker compose --env-file .env.docker down -v"
echo ""
echo "Tip: export COMPOSE_ENV_FILES=.env.docker to run plain 'docker compose' commands"
echo ""
echo "Database backups:"
echo "  • Backup:   ./scripts/docker-backup-db.sh"
echo "  • Restore:  ./scripts/docker-restore-db.sh <backup-file>"
echo ""
echo "================================================"
echo ""
echo "Note: This setup uses HTTP only. If you need HTTPS,"
echo "      set up your own reverse proxy (Caddy, Traefik,"
echo "      or Cloudflare Tunnel) in front of the app."
echo ""
