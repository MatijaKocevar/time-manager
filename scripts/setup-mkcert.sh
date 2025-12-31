#!/bin/bash

# Setup trusted local certificate using mkcert for PWA support

set -e

DOMAIN="time.manager"

echo "🔐 Setting up trusted local certificate with mkcert..."

# Install mkcert
echo "📦 Installing mkcert..."
sudo apt update
sudo apt install -y libnss3-tools
curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
chmod +x mkcert-v*-linux-amd64
sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert

# Create local CA
echo "🔑 Creating local Certificate Authority..."
mkcert -install

# Generate certificate for time.manager
echo "📜 Generating certificate for ${DOMAIN}..."
mkdir -p ~/certs
cd ~/certs
mkcert ${DOMAIN} localhost 127.0.0.1 ::1 192.168.0.10

# Copy certificates to nginx location
echo "📁 Installing certificates..."
sudo mkdir -p /etc/ssl/private
sudo mkdir -p /etc/ssl/certs
sudo cp ${DOMAIN}+4.pem /etc/ssl/certs/${DOMAIN}.crt
sudo cp ${DOMAIN}+4-key.pem /etc/ssl/private/${DOMAIN}.key
sudo chmod 600 /etc/ssl/private/${DOMAIN}.key
sudo chmod 644 /etc/ssl/certs/${DOMAIN}.crt

# Restart Nginx
echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx

echo ""
echo "✅ Trusted certificate installed on server!"
echo ""
echo "📝 To trust this certificate on your devices:"
echo ""
echo "1. Download the CA certificate:"
echo "   scp server@192.168.0.10:~/certs/rootCA.pem ~/Downloads/"
echo ""
echo "2. Install on each device:"
echo ""
echo "   Linux (Chrome/Firefox):"
echo "   - Chrome: Settings → Privacy → Manage certificates → Authorities → Import"
echo "   - Firefox: Settings → Privacy → Certificates → View Certificates → Import"
echo ""
echo "   Android:"
echo "   - Settings → Security → Install from storage → CA certificate"
echo ""
echo "   iOS:"
echo "   - AirDrop the rootCA.pem file → Settings → Profile Downloaded → Install"
echo "   - Then: Settings → General → About → Certificate Trust Settings → Enable"
echo ""
echo "   Windows:"
echo "   - Double-click rootCA.pem → Install Certificate → Local Machine"
echo "   - Place in 'Trusted Root Certification Authorities'"
echo ""
echo "   macOS:"
echo "   - Double-click rootCA.pem → Keychain Access"
echo "   - Double-click certificate → Trust → Always Trust"
