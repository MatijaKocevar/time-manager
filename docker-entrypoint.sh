#!/bin/sh
set -e

echo "==============================================="
echo "Time Management App - Docker Entrypoint"
echo "==============================================="

# Function to check if PostgreSQL is ready
wait_for_postgres() {
    echo "Waiting for PostgreSQL to be ready..."
    
    max_attempts=60
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if node -e "
            const net = require('net');
            const socket = net.createConnection({ host: 'db', port: 5432 }, () => {
                socket.end();
                process.exit(0);
            });
            socket.on('error', () => process.exit(1));
            setTimeout(() => process.exit(1), 3000);
        " 2>/dev/null; then
            echo "PostgreSQL is ready!"
            sleep 2
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo "Attempt $attempt/$max_attempts: PostgreSQL not ready yet, waiting..."
        sleep 2
    done
    
    echo "ERROR: PostgreSQL did not become ready in time"
    exit 1
}

# Wait for PostgreSQL to be accessible
wait_for_postgres

echo ""
echo "Running database migrations..."
npx prisma migrate deploy

echo ""
echo "Running database seed..."
echo "Creating admin user (admin@example.com / password123)"
if npx tsx prisma/seed/index.ts --minimal; then
    echo "Database seeded successfully!"
else
    echo "Warning: Seeding encountered errors but continuing..."
    echo "App will start but some features (like holidays) may be incomplete"
fi

echo ""
echo "Initializing materialized views..."
npx prisma db execute --stdin <<SQL
REFRESH MATERIALIZED VIEW daily_hour_summary;
SQL
echo "  Materialized views refreshed"

echo ""
echo "==============================================="
echo "Starting Next.js server on port ${PORT:-3000}..."
echo "==============================================="
echo ""

node server.js &
SERVER_PID=$!

echo "Waiting for server to be ready..."
for i in $(seq 1 30); do
    if node -e "
        require('http').get('http://localhost:${PORT:-3000}', (res) => process.exit(res.statusCode < 400 ? 0 : 1));
    " 2>/dev/null; then
        echo "Server is ready!"
        break
    fi
    sleep 1
done

echo ""
echo "==============================================="
echo "Starting background cron jobs..."
echo "==============================================="

if [ -f scripts/build/auto-checkin-checkout-cron.js ]; then
    echo "  Starting auto-checkin-checkout cron..."
    node scripts/build/auto-checkin-checkout-cron.js &
    echo "  ✓ Started (PID $!)"
else
    echo "  ⚠ auto-checkin-checkout-cron.js not found, skipping"
fi

if [ -f scripts/build/sync-urnik-cron.js ]; then
    echo "  Starting sync-urnik cron..."
    node scripts/build/sync-urnik-cron.js &
    echo "  ✓ Started (PID $!)"
else
    echo "  ⚠ sync-urnik-cron.js not found, skipping"
fi

echo ""
echo "==============================================="
echo "All services started!"
echo "==============================================="

wait $SERVER_PID
