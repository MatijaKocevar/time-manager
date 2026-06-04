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

docker compose up -d

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
echo "Useful commands:"
echo "  • View logs:        docker compose logs -f app"
echo "  • Update app:       ./scripts/docker-update.sh"
echo "  • Stop containers:  docker compose down"
echo "  • Restart:          docker compose restart"
echo "  • Remove all:       docker compose down -v"
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
