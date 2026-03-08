#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="$HOME/apps/luxapp"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

cd "$APP_DIR"

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

trap 'echo "[deploy] Failed at line $LINENO"; compose logs --tail=120 web || true' ERR

echo "[deploy] Fetching latest code..."
git fetch --all --prune
git checkout main
git pull --ff-only origin main

echo "[deploy] Building and restarting web..."
compose up -d --build web

echo "[deploy] Waiting for app startup..."
sleep 8

echo "[deploy] Status:"
compose ps

echo "[deploy] Checking local HTTP response..."
curl -fsS http://127.0.0.1:3000 >/dev/null

echo "[deploy] Recent web logs:"
compose logs --tail=80 web

echo "[deploy] Cleaning unused images..."
docker image prune -f

echo "[deploy] Done."