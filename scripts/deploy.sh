#!/bin/bash

set -e
set -x   # 🔥 shows each command (important for debugging)

echo "🚀 Starting Deployment..."

BRANCH=${BRANCH:-development}
DOCKER_IMAGE=${DOCKER_IMAGE}
APP_DIR=${APP_DIR:-/var/www/reyu-code}
COMPOSE_FILE=${COMPOSE_FILE:-server/docker-compose.prod.yml}

echo "📁 App Dir: $APP_DIR"
echo "🌿 Branch: $BRANCH"
echo "🐳 Image: $DOCKER_IMAGE"
echo "📦 Compose: $COMPOSE_FILE"

# Move to app dir
cd $APP_DIR

echo "🔄 Fetching latest code..."
git fetch origin

echo "⚠️ Resetting local changes..."
git reset --hard origin/$BRANCH

echo "🧹 Cleaning untracked files..."
git clean -fd

echo "📥 Pulling docker image..."
docker pull $DOCKER_IMAGE

echo "🔁 Exporting image..."
export DOCKER_IMAGE=$DOCKER_IMAGE

echo "🛑 Stopping containers..."
docker compose -f $COMPOSE_FILE down

echo "▶️ Starting containers..."
docker compose -f $COMPOSE_FILE up -d

echo "🧹 Cleaning old images..."
docker image prune -f

echo "✅ Deployment Completed!"
