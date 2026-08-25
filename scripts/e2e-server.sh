#!/usr/bin/env bash
set -euo pipefail

# Deliberately does NOT read .env: e2e owns its database and its ports so a
# running `bun dev` stack is never touched. Ports come from playwright.config.ts.
root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"
mkdir -p .data
rm -f .data/e2e.db .data/e2e.db-shm .data/e2e.db-wal

export TURSO_DATABASE_URL="file:${root}/.data/e2e.db"

bun tools/db/db-migrate.ts
bun tools/db/db-seed.ts

exec ./node_modules/.bin/concurrently --kill-others --names api,web --prefix-colors cyan,blue \
  "bun run --cwd apps/api dev" \
  "bun run --cwd apps/web dev"
