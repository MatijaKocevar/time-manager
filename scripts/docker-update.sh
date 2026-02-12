#!/bin/bash
set -e

echo "================================================"
echo "Time Management App - Docker Update"
echo "================================================"
echo ""

# Check if Docker is running
if ! docker compose version &> /dev/null; then
    echo "❌ Error: Docker Compose is not available"
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
# Check if database container is running
if docker compose ps db 2>/dev/null | grep -q "Up"; then
    ./scripts/docker-backup-db.sh
    echo "✓ Backup created"
else
    echo "⚠️  Database not running - skipping backup"
    echo "   (No new data to backup since last run)"
fi

echo ""
echo "Step 2: Pulling latest code..."
git pull origin main || git pull origin master || {
    echo "⚠️  Warning: Could not pull from git. Make sure you're in a git repository."
    echo "    If you downloaded as ZIP, you'll need to download the new version manually."
}

echo ""
echo "Step 3: Stopping containers..."
docker compose down

echo ""
echo "Step 4: Rebuilding images..."
docker compose build

echo ""
echo "Step 5: Starting updated containers..."
docker compose up -d

echo ""
echo "Step 6: Waiting for services to be healthy..."
sleep 10

# Check if containers are running
if docker compose ps | grep -q "Up"; then
    echo ""
    echo "================================================"
    echo "✓ Update Complete!"
    echo "================================================"
    echo ""
    echo "Your app has been updated successfully!"
    echo ""
    echo "Access the application:"
    echo "  • Main App:  http://localhost:6280"
    echo ""
    echo "Check logs if something seems wrong:"
    echo "  docker compose logs -f app"
    echo ""
else
    echo ""
    echo "❌ Warning: Some containers may not have started correctly"
    echo ""
    echo "Check the logs:"
    echo "  docker compose logs"
    echo ""
    echo "If there are issues, restore from backup:"
    echo "  ./scripts/docker-restore-db.sh <backup-file>"
    echo ""
    exit 1
fi
