#!/bin/bash

# Start Next.js dev server with HTTPS
next dev --hostname 0.0.0.0 --experimental-https --experimental-https-key certs/key.pem --experimental-https-cert certs/cert.pem &
NEXT_PID=$!

# Wait for Next.js to be ready
sleep 2

# Print custom URL
echo "   - Custom:        https://time-manager.home:3000"
echo ""

# Wait for Next.js process
wait $NEXT_PID
