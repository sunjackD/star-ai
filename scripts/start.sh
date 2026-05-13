#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"
export DOCKER_BUILDKIT=0

if [ ! -f ".env" ]; then
  cp ".env.example" ".env"
  echo "Created .env from .env.example. Review MySQL and JWT settings if needed."
fi

APP_PORT_VALUE="$(grep -E '^APP_PORT=' .env | tail -n 1 | cut -d '=' -f 2- || true)"
APP_PORT_VALUE="${APP_PORT_VALUE:-8081}"

docker compose build
docker compose up -d --remove-orphans

echo "AI Platform started: http://localhost:${APP_PORT_VALUE}"
echo "Swagger: http://localhost:${APP_PORT_VALUE}/swagger-ui.html"
