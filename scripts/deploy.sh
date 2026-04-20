#!/bin/bash

set -e

echo "🚀 Starting Deployment..."

BRANCH=${BRANCH:-development}
DOCKER_IMAGE=${DOCKER_IMAGE}
COMPOSE_FILE=${COMPOSE_FILE:-server/docker-compose.prod.yml}

echo "🌿 Branch: $BRANCH"
echo "🐳 Image: $DOCKER_IMAGE"

# Pull latest code
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

# Pull latest image
docker pull $DOCKER_IMAGE

# Export for docker-compose
export DOCKER_IMAGE=$DOCKER_IMAGE

# Restart containers
docker compose -f $COMPOSE_FILE down
docker compose -f $COMPOSE_FILE up -d

# Cleanup
docker image prune -f

echo "✅ Deployment Completed!"
