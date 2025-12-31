#!/bin/bash

# Fresh Installation Script for Time Management App
# Run this on a fresh Ubuntu/Kubuntu server to set everything up

set -e

echo "═══════════════════════════════════════════════════════════"
echo "  Time Management App - Fresh Server Installation Script"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Configuration - EDIT THESE VALUES
SERVER_USER="server"
SERVER_HOST="192.168.0.10"
DOMAIN="time.manager"
APP_PORT="3000"
HTTPS_PORT="8443"

echo "📋 Configuration:"
echo "   Server: $SERVER_USER@$SERVER_HOST"
echo "   Domain: $DOMAIN"
echo "   App Port: $APP_PORT"
echo "   HTTPS Port: $HTTPS_PORT"
echo ""

read -p "Continue with installation? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation cancelled."
    exit 1
fi

# Step 1: Setup SSH Key
echo ""
echo "Step 1/8: Setting up SSH key..."
if [ ! -f ~/.ssh/id_ed25519 ]; then
    ssh-keygen -t ed25519 -C "$USER@time-management-deploy" -f ~/.ssh/id_ed25519 -N ""
    echo "✅ SSH key generated"
else
    echo "✅ SSH key already exists"
fi

echo "📤 Copying SSH key to server (you'll need to enter the server password)..."
ssh-copy-id $SERVER_USER@$SERVER_HOST || echo "⚠️  SSH key may already be installed"

# Test SSH connection
echo "🔌 Testing SSH connection..."
ssh $SERVER_USER@$SERVER_HOST "echo '✅ SSH connection successful!'"

# Step 2: Transfer and run server setup script
echo ""
echo "Step 2/8: Installing Node.js, PM2, and Nginx on server..."
scp scripts/setup-server.sh $SERVER_USER@$SERVER_HOST:/tmp/
ssh -t $SERVER_USER@$SERVER_HOST "bash /tmp/setup-server.sh"

# Step 3: Setup mkcert for trusted certificates
echo ""
echo "Step 3/8: Setting up trusted SSL certificates..."
scp scripts/setup-mkcert.sh $SERVER_USER@$SERVER_HOST:/tmp/
ssh -t $SERVER_USER@$SERVER_HOST "bash /tmp/setup-mkcert.sh"

# Step 4: Setup HTTPS with Nginx
echo ""
echo "Step 4/8: Configuring Nginx for HTTPS..."
scp scripts/setup-https.sh $SERVER_USER@$SERVER_HOST:/tmp/
ssh -t $SERVER_USER@$SERVER_HOST "bash /tmp/setup-https.sh"

# Step 5: Remove default Nginx site and restart
echo ""
echo "Step 5/8: Finalizing Nginx configuration..."
ssh -t $SERVER_USER@$SERVER_HOST "sudo rm -f /etc/nginx/sites-enabled/default && sudo systemctl restart nginx"

# Step 6: Open firewall ports
echo ""
echo "Step 6/8: Opening firewall ports..."
ssh -t $SERVER_USER@$SERVER_HOST "sudo ufw allow $APP_PORT/tcp comment 'Time Management App' && sudo ufw allow $HTTPS_PORT/tcp comment 'Time Manager HTTPS'"

# Step 7: Download and install CA certificate locally
echo ""
echo "Step 7/8: Installing CA certificate on your local machine..."
scp $SERVER_USER@$SERVER_HOST:.local/share/mkcert/rootCA.pem ~/Downloads/
mkdir -p ~/.pki/nssdb
certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n "mkcert $DOMAIN" -i ~/Downloads/rootCA.pem 2>&1 || echo "⚠️  Could not install in Chrome cert store (may not exist)"

# Step 8: Create .env file on server
echo ""
echo "Step 8/8: Creating environment configuration..."
echo ""
echo "⚠️  You need to provide the following information:"
echo ""
read -p "Enter your Neon DATABASE_URL: " DATABASE_URL
echo ""
echo "Generating NEXTAUTH_SECRET..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "✅ Generated: $NEXTAUTH_SECRET"
echo ""

ssh $SERVER_USER@$SERVER_HOST "mkdir -p /home/server/time-management-app && cat > /home/server/time-management-app/.env" << EOF
DATABASE_URL="$DATABASE_URL"
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"
NEXTAUTH_URL="https://$DOMAIN:$HTTPS_PORT"
NODE_ENV="production"
EOF

echo "✅ Environment file created on server"

# Deploy the application
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Deploying Application"
echo "═══════════════════════════════════════════════════════════"
./scripts/deploy.sh

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ Installation Complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📝 Final Steps:"
echo ""
echo "1. Add DNS record in Pi-hole:"
echo "   Go to: http://$SERVER_HOST/admin"
echo "   Navigate to: Local DNS → DNS Records"
echo "   Add: $DOMAIN → $SERVER_HOST"
echo ""
echo "2. Restart your browser to trust the certificate"
echo ""
echo "3. Access your app:"
echo "   HTTP:  http://$SERVER_HOST:$APP_PORT"
echo "   HTTPS: https://$SERVER_HOST:$HTTPS_PORT"
echo "   Domain: https://$DOMAIN:$HTTPS_PORT"
echo ""
echo "4. Install PWA from the browser (app menu → Install)"
echo ""
echo "5. For other devices (phone/tablet):"
echo "   - Transfer ~/Downloads/rootCA.pem to the device"
echo "   - Install as a trusted certificate"
echo ""
echo "═══════════════════════════════════════════════════════════"
