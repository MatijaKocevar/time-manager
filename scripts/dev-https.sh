#!/bin/bash

# Start Next.js dev server with HTTPS (if certs available) or fallback to HTTP

CERT_KEY="certs/key.pem"
CERT_FILE="certs/cert.pem"

if [ -f "$CERT_KEY" ] && [ -f "$CERT_FILE" ]; then
    echo "🔒 Starting with HTTPS..."
    next dev --hostname 0.0.0.0 --experimental-https --experimental-https-key "$CERT_KEY" --experimental-https-cert "$CERT_FILE" &
    NEXT_PID=$!
    sleep 2
    echo "   - Custom:        https://time-manager.home:3000"
else
    echo "⚠️  HTTPS certificates not found at certs/key.pem and certs/cert.pem"
    echo "   Falling back to HTTP. Generate certs with: mkcert -install && mkcert time-manager.home"
    next dev --hostname 0.0.0.0 &
    NEXT_PID=$!
    sleep 2
    echo "   - Custom:        http://time-manager.home:3000"
fi

echo ""

# Wait for Next.js process
wait $NEXT_PID
