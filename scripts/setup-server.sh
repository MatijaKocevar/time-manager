#!/bin/bash

# Server Setup Script for Kubuntu
# Run this script on the server (192.168.0.10) to install required dependencies

set -e

echo "🔧 Setting up server for time-management-app deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update

# Install Node.js 20.x (LTS)
echo "📦 Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2 process manager..."
sudo npm install -g pm2

# Install nginx for reverse proxy
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Create app directory
echo "📁 Creating application directory..."
mkdir -p /home/server/time-management-app/logs

# Setup PM2 to start on boot
echo "🔧 Setting up PM2 startup script..."
pm2 startup systemd -u server --hp /home/server

echo "✅ Server setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Create .env file in /home/server/time-management-app with:"
echo "     - DATABASE_URL (copy from your local .env)"
echo "     - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
echo "     - NEXTAUTH_URL=http://192.168.0.10:3000"
echo "  2. Run the deploy script from your local machine"
echo "  3. Configure Nginx reverse proxy (optional)"
echo ""
echo "📊 Installed versions:"
node --version
npm --version
pm2 --version
