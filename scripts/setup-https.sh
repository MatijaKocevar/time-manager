#!/bin/bash

# HTTPS Setup Script for time.manager
# Run this on the server to configure Nginx with self-signed certificate

set -e

DOMAIN="time.manager"
CERT_DIR="/etc/ssl/certs"
KEY_DIR="/etc/ssl/private"
CERT_FILE="${CERT_DIR}/${DOMAIN}.crt"
KEY_FILE="${KEY_DIR}/${DOMAIN}.key"

echo "🔐 Setting up HTTPS for ${DOMAIN}..."

# Generate self-signed certificate
echo "📜 Generating self-signed certificate..."
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "${KEY_FILE}" \
    -out "${CERT_FILE}" \
    -subj "/C=SI/ST=Slovenia/L=Ljubljana/O=HomeServer/CN=${DOMAIN}"

# Set proper permissions
sudo chmod 600 "${KEY_FILE}"
sudo chmod 644 "${CERT_FILE}"

# Create Nginx configuration
echo "⚙️  Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/${DOMAIN} > /dev/null << 'NGINX_CONFIG'
server {
    listen 8443 ssl;
    listen [::]:8443 ssl;
    http2 on;
    server_name time.manager;

    ssl_certificate /etc/ssl/certs/time.manager.crt;
    ssl_certificate_key /etc/ssl/private/time.manager.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host:$server_port;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_CONFIG

# Enable the site
echo "🔗 Enabling site..."
sudo ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/${DOMAIN}

# Test Nginx configuration
echo "✅ Testing Nginx configuration..."
sudo nginx -t

# Restart Nginx
echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx

echo ""
echo "✅ HTTPS setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Add DNS entry in Pi-hole: time.manager -> 192.168.0.10"
echo "  2. Update NEXTAUTH_URL in server .env to https://time.manager:8443"
echo "  3. Restart the app: pm2 restart time-management-app"
echo "  4. Open port 8443 in firewall: sudo ufw allow 8443/tcp"
echo ""
echo "🌐 Your app will be available at: https://time.manager:8443"
echo "⚠️  Accept the self-signed certificate warning in your browser"
