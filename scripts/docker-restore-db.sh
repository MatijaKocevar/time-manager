#!/bin/bash
set -e

echo "================================================"
echo "Docker Database Restore"
echo "================================================"
echo ""

# Check if backup file was provided
if [ -z "$1" ]; then
    echo "Error: No backup file specified!"
    echo ""
    echo "Usage: $0 <backup-file>"
    echo ""
    echo "Available backups:"
    ls -lh backups/timeapp-*.sql* 2>/dev/null || echo "  No backups found"
    echo ""
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Check if file is gzipped
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Detected compressed backup file"
    DECOMPRESS_CMD="gunzip -c"
else
    DECOMPRESS_CMD="cat"
fi

# Check if database container is running
if ! docker compose ps db | grep -q "Up"; then
    echo "Error: Database container is not running!"
    echo "Start it with: docker compose up -d db"
    exit 1
fi

echo "⚠️  WARNING: This will replace all data in the database!"
echo "Backup file: $BACKUP_FILE"
echo "Database: timeapp"
echo ""
read -p "Are you sure you want to continue? (yes/no) " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

echo "Stopping application container..."
docker compose stop app

echo ""
echo "Creating backup of current database (just in case)..."
SAFETY_BACKUP="backups/pre-restore-$(date +%Y%m%d-%H%M%S).sql"
docker compose exec -T db pg_dump -U timeapp -d timeapp > "$SAFETY_BACKUP"
echo "✓ Safety backup created: $SAFETY_BACKUP"

echo ""
echo "Restoring database..."

# Restore the backup
$DECOMPRESS_CMD "$BACKUP_FILE" | docker compose exec -T db psql -U timeapp -d timeapp

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Database restored successfully!"
    echo ""
    echo "Starting application container..."
    docker compose start app
    
    echo ""
    echo "================================================"
    echo "Restore Summary"
    echo "================================================"
    echo "Restored from: $BACKUP_FILE"
    echo "Safety backup: $SAFETY_BACKUP"
    echo ""
    echo "Application is starting up..."
    echo "View logs with: docker compose logs -f app"
    echo ""
else
    echo ""
    echo "✗ Restore failed!"
    echo ""
    echo "Attempting to restore from safety backup..."
    cat "$SAFETY_BACKUP" | docker compose exec -T db psql -U timeapp -d timeapp
    
    if [ $? -eq 0 ]; then
        echo "✓ Reverted to safety backup"
    else
        echo "✗ Failed to revert! Database may be in inconsistent state."
        echo "Please restore manually from: $SAFETY_BACKUP"
    fi
    
    docker compose start app
    exit 1
fi
