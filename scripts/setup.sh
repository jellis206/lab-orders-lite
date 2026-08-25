#!/usr/bin/env bash
# One-shot onboarding: deps, .env, browser, migrated + seeded local database.
# Safe to rerun.
set -euo pipefail

cd "$(cd "$(dirname "$0")/.." && pwd)"

need() {
  command -v "$1" >/dev/null 2>&1 || { echo "Missing $1. Install it with: $2"; exit 1; }
}
need bun "curl -fsSL https://bun.sh/install | bash"
need turso "brew install tursodatabase/tap/turso"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi
set -a && . ./.env && set +a

bun install
bunx playwright install chromium

if lsof -nP -iTCP:"$TURSO_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $TURSO_PORT is in use. Change TURSO_PORT in .env or stop that process."
  exit 1
fi

mkdir -p .data
turso dev --db-file .data/lab-orders.db --port "$TURSO_PORT" >/dev/null 2>&1 &
trap 'kill %1 2>/dev/null || true' EXIT

for _ in $(seq 1 30); do
  curl -fs "http://127.0.0.1:$TURSO_PORT/health" >/dev/null 2>&1 && break
  sleep 1
done

bun tools/db/db-migrate.ts
bun tools/db/db-seed.ts

echo
echo "Ready. Start everything with: bun dev"
