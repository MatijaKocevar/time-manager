#!/bin/bash

# Docker Deployment Script
# Deploys the time-management-app Docker stack to the server at 192.168.0.10.
# Run from any PC with SSH access to the server.
#
# Usage:
#   ./scripts/deploy-docker.sh            # git pull + rebuild + restart
#   ./scripts/deploy-docker.sh --backup    # also backup database first
#   ./scripts/deploy-docker.sh --no-build  # skip rebuild (restart only)

set -e

SERVER_USER="server"
SERVER_HOST="192.168.0.10"
SERVER_PATH="/home/server/Documents/time-manager"

BACKUP=false
NO_BUILD=false

for arg in "$@"; do
    case $arg in
        --backup) BACKUP=true ;;
        --no-build) NO_BUILD=true ;;
    esac
done

echo "Deploying to $SERVER_HOST..."

ssh $SERVER_USER@$SERVER_HOST bash -s "$BACKUP" "$NO_BUILD" << 'ENDSSH'
set -e
BACKUP=$1
NO_BUILD=$2

cd /home/server/Documents/time-manager

echo ""
echo "Pulling latest changes..."
git pull origin master

if [ "$BACKUP" = true ]; then
    echo ""
    echo "Creating database backup..."
    ./scripts/docker-backup-db.sh
fi

echo ""
echo "Rebuilding and restarting containers..."
docker compose down

if [ "$NO_BUILD" = true ]; then
    docker compose up -d
else
    docker compose build
    docker compose up -d
fi

echo ""
echo "Waiting for services..."
sleep 5

if docker compose ps | grep -q "Up"; then
    echo ""
    echo "Deploy complete!"
    echo "https://time.manager:8443"
else
    echo ""
    echo "ERROR: Some containers failed to start"
    echo "Check logs: ssh server@192.168.0.10 'cd /home/server/Documents/time-manager && docker compose logs'"
    exit 1
fi
ENDSSH
echo ""
echo "Deploy complete!"
echo "Access: http://192.168.0.10:6280"
echo ""
echo "Useful commands:"
echo "  View logs:    ssh $SERVER_USER@$SERVER_HOST 'cd /home/server/Documents/time-manager && docker compose logs -f app'"
echo "  Check status: ssh $SERVER_USER@$SERVER_HOST 'cd /home/server/Documents/time-manager && docker compose ps'"
echo "  Restart:      ssh $SERVER_USER@$SERVER_HOST 'cd /home/server/Documents/time-manager && docker compose restart'"
echo "  Redeploy:     ./scripts/deploy-docker.sh"
