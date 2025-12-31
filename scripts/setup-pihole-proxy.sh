#!/bin/bash

# Configure Pi-hole's lighttpd to proxy time.manager to time management app
# This keeps Pi-hole working normally while adding the time app

set -e

DOMAIN="time.manager"
APP_PORT="3000"
CERT_DIR="/etc/lighttpd/ssl"
CERT_FILE="${CERT_DIR}/${DOMAIN}.crt"
KEY_FILE="${CERT_DIR}/${DOMAIN}.key"

echo "🔐 Setting up HTTPS proxy for ${DOMAIN} via Pi-hole's lighttpd..."

# Create SSL directory
echo "📁 Creating SSL directory..."
sudo mkdir -p ${CERT_DIR}

# Generate self-signed certificate
echo "📜 Generating self-signed certificate..."
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "${KEY_FILE}" \
    -out "${CERT_FILE}" \
    -subj "/C=SI/ST=Slovenia/L=Ljubljana/O=HomeServer/CN=${DOMAIN}"

# Set proper permissions
sudo chmod 600 "${KEY_FILE}"
sudo chmod 644 "${CERT_FILE}"

# Enable required lighttpd modules
echo "🔧 Enabling lighttpd modules..."
sudo lighty-enable-mod proxy || true
sudo lighty-enable-mod ssl || true

# Create lighttpd configuration for time.manager
echo "⚙️  Creating lighttpd configuration..."
sudo tee /etc/lighttpd/conf-enabled/50-time-manager.conf > /dev/null << EOF
\$HTTP["host"] == "${DOMAIN}" {
    # SSL configuration for time.manager
    \$SERVER["socket"] == ":443" {
        ssl.engine = "enable"
        ssl.pemfile = "${CERT_FILE}"
        ssl.privkey = "${KEY_FILE}"
        
        proxy.server = ( "" => (
            ( "host" => "127.0.0.1", "port" => ${APP_PORT} )
        ))
        proxy.header = (
            "https-remap" => "enable",
            "upgrade" => "enable",
            "connect" => "enable"
        )
    }
    
    # Also handle HTTP requests (optional redirect to HTTPS)
    \$SERVER["socket"] == ":80" {
        proxy.server = ( "" => (
            ( "host" => "127.0.0.1", "port" => ${APP_PORT} )
        ))
        proxy.header = (
            "upgrade" => "enable",
            "connect" => "enable"
        )
    }
}
EOF

# Test lighttpd configuration
echo "✅ Testing lighttpd configuration..."
sudo lighttpd -t -f /etc/lighttpd/lighttpd.conf

# Restart lighttpd
echo "🔄 Restarting lighttpd..."
sudo systemctl restart lighttpd

# Wait for lighttpd to start
sleep 2

# Check if lighttpd is running
if sudo systemctl is-active --quiet lighttpd; then
    echo "✅ Lighttpd restarted successfully!"
else
    echo "❌ Lighttpd failed to start. Rolling back..."
    sudo rm -f /etc/lighttpd/conf-enabled/50-time-manager.conf
    sudo systemctl restart lighttpd
    exit 1
fi

echo ""
echo "✅ HTTPS proxy setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Add DNS record in Pi-hole admin:"
echo "     Go to Local DNS → DNS Records"
echo "     Domain: time.manager → IP: 192.168.0.10"
echo ""
echo "  2. Update NEXTAUTH_URL on server:"
echo "     Edit /home/server/time-management-app/.env"
echo "     Change NEXTAUTH_URL to: https://time.manager"
echo ""
echo "  3. Restart the app:"
echo "     pm2 restart time-management-app"
echo ""
echo "🌐 Your app will be available at:"
echo "   HTTPS: https://time.manager"
echo "   HTTP:  http://time.manager"
echo ""
echo "🛡️  Pi-hole admin remains accessible at:"
echo "   http://192.168.0.10/admin or http://pi.hole/admin"
echo ""
echo "⚠️  Accept the self-signed certificate warning in your browser"
