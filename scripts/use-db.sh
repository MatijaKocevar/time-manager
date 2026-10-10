#!/bin/bash
set -e

PROFILE="$1"

if [[ "$PROFILE" != "prod" && "$PROFILE" != "dev" ]]; then
    echo "Usage: $0 <prod|dev>"
    exit 1
fi

SOURCE=".env.db.$PROFILE"

if [ ! -f "$SOURCE" ]; then
    echo "Missing $SOURCE"
    exit 1
fi

if ! grep -q '^DATABASE_URL=' "$SOURCE"; then
    echo "$SOURCE does not contain DATABASE_URL"
    exit 1
fi

HOST=$(grep '^DATABASE_URL=' "$SOURCE" | sed -E 's|.*@([^/]+)/.*|\1|')

{
    echo "# Active database profile: $PROFILE (switch with ./scripts/use-db.sh <prod|dev>)"
    grep '^DATABASE_URL=' "$SOURCE"
} > .env.local

echo "Active database: $PROFILE ($HOST)"
echo "Wrote .env.local — restart the dev server to apply."
