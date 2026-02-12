#!/bin/sh
set -e

echo "==============================================="
echo "Time Management App - Docker Entrypoint"
echo "==============================================="

# Function to check if PostgreSQL is ready
wait_for_postgres() {
    echo "Waiting for PostgreSQL to be ready..."
    
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if node -e "
            const { PrismaClient } = require('./prisma/generated/client');
            const prisma = new PrismaClient();
            prisma.\$connect()
                .then(() => { console.log('Connected'); process.exit(0); })
                .catch(() => { process.exit(1); });
        " 2>/dev/null; then
            echo "PostgreSQL is ready!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo "Attempt $attempt/$max_attempts: PostgreSQL not ready yet, waiting..."
        sleep 2
    done
    
    echo "ERROR: PostgreSQL did not become ready in time"
    exit 1
}

# Function to check if database is empty (no users)
is_database_empty() {
    node -e "
        const { PrismaClient } = require('./prisma/generated/client');
        const prisma = new PrismaClient();
        prisma.user.count()
            .then(count => {
                process.exit(count === 0 ? 0 : 1);
            })
            .catch(() => process.exit(1))
            .finally(() => prisma.\$disconnect());
    " 2>/dev/null
}

# Wait for PostgreSQL to be accessible
wait_for_postgres

echo ""
echo "Running database migrations..."
npx prisma migrate deploy

echo ""
echo "Checking if database needs seeding..."
if is_database_empty; then
    echo "Database is empty - running minimal seed..."
    echo "Creating demo admin user (demo@example.com / password123)"
    if npx tsx prisma/seed/index.ts --minimal; then
        echo "Database seeded successfully!"
    else
        echo "⚠️  Warning: Seeding encountered errors but continuing..."
        echo "   App will start but some features (like holidays) may be incomplete"
    fi
else
    echo "Database already contains data - skipping seed"
fi

echo ""
echo "==============================================="
echo "Starting Next.js server on port ${PORT:-3000}..."
echo "==============================================="
echo ""

# Start the Next.js server
exec node server.js
