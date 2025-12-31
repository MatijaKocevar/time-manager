#!/bin/bash

# Deployment Script
# Deploys the time-management-app to the server at 192.168.0.10

set -e

SERVER_USER="server"
SERVER_HOST="192.168.0.10"
SERVER_PATH="/home/server/time-management-app"
LOCAL_PATH="$(pwd)"

echo "🚀 Starting deployment to $SERVER_HOST..."

# Build the application locally
echo "📦 Building application..."
npm run build

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Create deployment archive (only standalone build + static files + public)
echo "📦 Creating deployment archive..."
tar -czf deploy.tar.gz \
    .next/standalone \
    .next/static \
    public \
    prisma/schema.prisma \
    prisma/migrations \
    ecosystem.config.js

# Transfer to server
echo "📤 Transferring files to server..."
scp deploy.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/

# Deploy on server
echo "🔧 Deploying on server..."
ssh $SERVER_USER@$SERVER_HOST << 'ENDSSH'
set -e

cd /home/server/time-management-app

# Backup old deployment
if [ -d ".next" ]; then
    echo "📦 Backing up old deployment..."
    rm -rf .next.backup
    mv .next .next.backup || true
fi

# Extract files
echo "📦 Extracting files..."
tar -xzf /tmp/deploy.tar.gz
rm /tmp/deploy.tar.gz

# Copy static files to standalone
echo "📦 Setting up static files..."
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

# Copy .env file to standalone directory
echo "📝 Copying environment file..."
cp .env .next/standalone/

# Create logs directory if it doesn't exist
mkdir -p logs

# Restart application with PM2
echo "🔄 Restarting application..."
pm2 delete time-management-app 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo "✅ Deployment complete!"
echo "📊 Application status:"
pm2 status

echo ""
echo "🌐 Application should be running at:"
echo "   http://192.168.0.10:3000"
ENDSSH

# Clean up local archive
rm deploy.tar.gz

echo ""
echo "✅ Deployment successful!"
echo "🌐 Access your app at:"
echo "   HTTP:  http://192.168.0.10:3000"
echo "   HTTPS: https://192.168.0.10:8443"
echo "   Domain: https://time.manager:8443"
echo ""
echo "📝 Useful commands:"
echo "  View logs:    ssh $SERVER_USER@$SERVER_HOST 'pm2 logs time-management-app'"
echo "  Check status: ssh $SERVER_USER@$SERVER_HOST 'pm2 status'"
echo "  Restart app:  ssh $SERVER_USER@$SERVER_HOST 'pm2 restart time-management-app'"
echo "  Redeploy:     ./scripts/deploy.sh"
