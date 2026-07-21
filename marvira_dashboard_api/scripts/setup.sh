#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

cp -n .env.example .env 2>/dev/null || true

echo "Starting infrastructure..."
docker compose -f docker/docker-compose.yml up -d postgres redis

echo "Waiting for PostgreSQL..."
until docker compose -f docker/docker-compose.yml exec -T postgres pg_isready -U marvira; do
  sleep 2
done

export DATABASE_URL="postgresql://marvira:marvira@localhost:5432/marvira?schema=public"
export REDIS_URL="redis://localhost:6379"

pnpm install
pnpm --filter @marvira/shared-types build
pnpm --filter @marvira/shared-utils build
pnpm --filter @marvira/api exec prisma migrate deploy
pnpm db:seed

echo ""
echo "Setup complete!"
echo "  API:       pnpm dev:api       -> http://localhost:3001"
echo "  Dashboard: pnpm dev:dashboard -> http://localhost:3000"
echo "  Swagger:   http://localhost:3001/docs"
echo "  Admin:     admin@marvira.com / admin123"
