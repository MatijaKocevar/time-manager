#!/bin/bash
set -e

echo "================================================"
echo "Docker Database Backup"
echo "================================================"
echo ""

# Create backups directory if it doesn't exist
mkdir -p backups

# Check if database container is running
if ! docker compose ps db | grep -q "Up"; then
    echo "Error: Database container is not running!"
    echo "Start it with: docker compose up -d db"
    exit 1
fi

# Generate backup filename with timestamp
BACKUP_FILE="backups/timeapp-$(date +%Y%m%d-%H%M%S).sql"

echo "Creating database backup..."
echo "Backup file: $BACKUP_FILE"
echo ""

# Create backup
docker compose exec -T db pg_dump -U timeapp -d timeapp > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ] && [ -s "$BACKUP_FILE" ]; then
    # Get file size
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    
    echo "✓ Backup completed successfully!"
    echo "  File: $BACKUP_FILE"
    echo "  Size: $SIZE"
    echo ""
    
    # Optional: Create compressed version
    read -p "Create compressed version? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Compressing backup..."
        gzip -c "$BACKUP_FILE" > "${BACKUP_FILE}.gz"
        COMPRESSED_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
        echo "✓ Compressed backup created: ${BACKUP_FILE}.gz ($COMPRESSED_SIZE)"
    fi
    
    echo ""
    echo "================================================"
    echo "Backup Summary"
    echo "================================================"
    echo "Location: $BACKUP_FILE"
    echo ""
    echo "To restore this backup:"
    echo "  ./scripts/docker-restore-db.sh $BACKUP_FILE"
    echo ""
else
    echo "✗ Backup failed!"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Show backup list
echo "All backups:"
ls -lh backups/timeapp-*.sql* 2>/dev/null | tail -n 10 || echo "No backups found"
echo ""
