#!/bin/bash
set -e

echo "================================================"
echo "Time Management App - Docker Update"
echo "================================================"
echo ""

if ! docker compose version &> /dev/null; then
    echo "Error: Docker Compose is not available"
    exit 1
fi

echo "This will update your Time Management App to the latest version."
echo "Your data (database, files) will be preserved."
echo ""
read -p "Continue with update? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Update cancelled."
    exit 0
fi

echo ""
echo "Step 1: Creating backup..."
if docker compose ps db 2>/dev/null | grep -q "Up"; then
    ./scripts/docker-backup-db.sh
    echo "  Backup created"
else
    echo "  Database not running - skipping backup"
fi

echo ""
echo "Step 2: Pulling latest code..."
git pull origin master || git pull origin main || {
    echo "  Warning: Could not pull from git. Continuing with local code."
}

echo ""
echo "Step 3: Merging new environment variables..."
if [ -f .env.docker ] && [ -f .env.docker.example ]; then
    while IFS='=' read -r key value; do
        key=$(echo "$key" | xargs)
        [ -z "$key" ] && continue
        [[ "$key" =~ ^# ]] && continue
        if ! grep -q "^${key}=" .env.docker; then
            echo "  Adding new variable: $key"
            echo "$key=$value" >> .env.docker
        fi
    done < <(grep -E '^[A-Z_]+\s*=' .env.docker.example)
    echo "  Environment updated"
else
    echo "  No .env.docker found - run docker-setup.sh first"
    exit 1
fi

# Generate any missing secrets (same logic as docker-setup.sh)
NEXTAUTH_SECRET=$(grep "^NEXTAUTH_SECRET=" .env.docker | cut -d '=' -f2- | tr -d '"' | tr -d "'")
ENCRYPTION_KEY=$(grep "^ENCRYPTION_KEY=" .env.docker | cut -d '=' -f2- | tr -d '"' | tr -d "'")
CRON_SECRET=$(grep "^CRON_SECRET=" .env.docker | cut -d '=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$NEXTAUTH_SECRET" ] || [ "$NEXTAUTH_SECRET" = "your-nextauth-secret-here" ]; then
    NEW_NEXTAUTH_SECRET=$(openssl rand -base64 32)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$NEW_NEXTAUTH_SECRET\"|" .env.docker
    else
        sed -i "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$NEW_NEXTAUTH_SECRET\"|" .env.docker
    fi
    echo "  Generated NEXTAUTH_SECRET"
fi

if [ -z "$ENCRYPTION_KEY" ] || [ "$ENCRYPTION_KEY" = "your-encryption-key-here" ]; then
    NEW_ENCRYPTION_KEY=$(openssl rand -hex 32)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=\"$NEW_ENCRYPTION_KEY\"|" .env.docker
    else
        sed -i "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=\"$NEW_ENCRYPTION_KEY\"|" .env.docker
    fi
    echo "  Generated ENCRYPTION_KEY"
fi

if [ -z "$CRON_SECRET" ] || [ "$CRON_SECRET" = "your-cron-secret-here" ]; then
    NEW_CRON_SECRET=$(openssl rand -base64 32)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^CRON_SECRET=.*|CRON_SECRET=\"$NEW_CRON_SECRET\"|" .env.docker
    else
        sed -i "s|^CRON_SECRET=.*|CRON_SECRET=\"$NEW_CRON_SECRET\"|" .env.docker
    fi
    echo "  Generated CRON_SECRET"
fi

echo ""
echo "Step 4: Stopping containers..."
docker compose down

echo ""
echo "Step 5: Rebuilding and starting..."
docker compose up -d --build

echo ""
echo "Waiting for services..."
sleep 10

if docker compose ps | grep -q "Up"; then
    echo ""
    echo "================================================"
    echo "Update Complete!"
    echo "================================================"
    echo ""
    echo "Access: http://localhost:6280"
    echo ""
    echo "Check logs: docker compose logs -f app"
else
    echo ""
    echo "Warning: Some containers may not have started"
    echo "Check logs: docker compose logs"
    echo "Restore backup: ./scripts/docker-restore-db.sh <file>"
    exit 1
fi
