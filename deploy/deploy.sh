#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$HOME/apps/luxapp"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

cd "$APP_DIR"

echo "[deploy] Fetching latest code..."
git fetch --all --prune
git reset --hard origin/main

echo "[deploy] Building & starting containers..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build

echo "[deploy] Status:"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build

echo "[deploy] Cleaning unused images..."
docker image prune -f

echo "[deploy] Done."
