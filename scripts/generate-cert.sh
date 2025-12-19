#!/bin/bash

# Generate self-signed SSL certificate for local HTTPS development
# This allows testing PWA features on mobile devices

echo "🔒 Generating self-signed SSL certificate for local development..."

# Create certs directory
mkdir -p certs

# Generate private key and certificate
openssl req -x509 -newkey rsa:4096 -nodes \
  -keyout certs/key.pem \
  -out certs/cert.pem \
  -days 365 \
  -subj "/C=US/ST=State/L=City/O=Development/CN=time-manager.home" \
  -addext "subjectAltName=DNS:localhost,DNS:time-manager.home,IP:192.168.0.237,IP:192.168.0.83,IP:127.0.0.1"

echo ""
echo "✅ Certificate generated successfully!"
echo ""
echo "📁 Certificate files created:"
echo "   - certs/key.pem (private key)"
echo "   - certs/cert.pem (certificate)"
echo ""
echo "📱 To test on your phone:"
echo "   1. Find your local IP: ip addr show | grep 'inet '"
echo "   2. Update subjectAltName in this script with your IP"
echo "   3. Re-run: ./generate-cert.sh"
echo "   4. Start dev server: npm run dev"
echo "   5. On your phone, visit: https://YOUR_IP:3000"
echo "   6. Accept the security warning (self-signed cert)"
echo ""
echo "⚠️  Note: You'll need to accept the certificate warning on each device"
