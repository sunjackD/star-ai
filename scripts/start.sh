#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"
export DOCKER_BUILDKIT=0

if [ ! -f ".env" ]; then
  cp ".env.example" ".env"
  echo "Created .env from .env.example. Review MySQL and JWT settings if needed."
fi

docker compose build
docker compose up -d

echo "AI Platform started: http://localhost:8081"
echo "Backend API: http://localhost:8080/swagger-ui.html"
