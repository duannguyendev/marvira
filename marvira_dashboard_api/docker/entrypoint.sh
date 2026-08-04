#!/bin/sh
set -e

echo "Boot: NODE_ENV=${NODE_ENV:-unset} PORT=${PORT:-unset}"
echo "Boot: DATABASE_URL set=$([ -n \"$DATABASE_URL\" ] && echo yes || echo NO)"
echo "Boot: REDIS_URL set=$([ -n \"$REDIS_URL\" ] && echo yes || echo NO)"

if [ "${SKIP_MIGRATE_ON_BOOT}" != "true" ]; then
  echo "Running database migrations..."
  prisma migrate deploy --schema=./prisma/schema.prisma
fi

if [ ! -f dist/main.js ]; then
  echo "ERROR: dist/main.js missing after deploy package. Contents:"
  ls -la
  ls -la dist 2>/dev/null || true
  exit 1
fi

echo "Starting API on 0.0.0.0:${PORT:-8080}..."
exec node dist/main.js
