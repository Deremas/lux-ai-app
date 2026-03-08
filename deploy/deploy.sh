#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

cd "$APP_DIR"

trap 'echo "[deploy] Failed at line $LINENO"; compose logs --tail=120 web || true' ERR

echo "[deploy] Fetching latest code..."
git fetch --all --prune
git checkout main
git pull --ff-only origin main

echo "[deploy] Building and restarting containers..."
compose up -d --build

echo "[deploy] Status:"
compose ps

echo "[deploy] Recent web logs:"
compose logs --tail=80 web

echo "[deploy] Cleaning unused images..."
docker image prune -f

echo "[deploy] Done."