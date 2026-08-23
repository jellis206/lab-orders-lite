#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"
mkdir -p .data
rm -f .data/e2e.db .data/e2e.db-shm .data/e2e.db-wal

export TURSO_DATABASE_URL="file:${root}/.data/e2e.db"
export PORT="${PORT:-3000}"

bun run db:migrate
bun run db:seed

exec ./node_modules/.bin/concurrently --kill-others --names api,web --prefix-colors cyan,blue \
  "bun run dev:api" \
  "bun run dev:web"
