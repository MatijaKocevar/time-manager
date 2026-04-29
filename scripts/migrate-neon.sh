#!/bin/bash

set -e

ENV_FILE=".env.vercel"

if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: $ENV_FILE not found"
    exit 1
fi

NEON_DATABASE_URL=$(grep '^DATABASE_URL=' "$ENV_FILE" | cut -d '"' -f 2)

if [ -z "$NEON_DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL not found in $ENV_FILE"
    exit 1
fi

echo "Running migrations against Neon database..."
DATABASE_URL="$NEON_DATABASE_URL" npx prisma migrate deploy
echo "Done."
