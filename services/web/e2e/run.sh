#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(dirname "$SCRIPT_DIR")"

export DATABASE_URL="postgres://test:test@localhost:5433/test"
export BETTER_AUTH_URL="http://localhost:3001"
export BETTER_AUTH_SECRET="e2e-test-secret-that-is-definitely-longer-than-32-characters"
export NODE_ENV="production"
export E2E_BASE_URL="http://localhost:3001"
export SKIP_ENV_VALIDATION="true"

APP_PID=""

cleanup() {
  echo ""
  echo "--- Cleanup ---"
  if [ -n "$APP_PID" ]; then
    echo "Stopping app (PID $APP_PID)..."
    kill "$APP_PID" 2>/dev/null || true
    wait "$APP_PID" 2>/dev/null || true
  fi
  echo "Stopping test database..."
  docker compose -f "$SCRIPT_DIR/compose.yaml" down --volumes 2>/dev/null || true
  echo "Done."
}
trap cleanup EXIT

echo "=== Marshant E2E Test Suite ==="

# 1. Start test database
echo ""
echo "--- Starting test database ---"
docker compose -f "$SCRIPT_DIR/compose.yaml" up -d --wait

# 2. Push schema
echo ""
echo "--- Pushing schema ---"
cd "$WEB_DIR"
pnpm exec drizzle-kit push --force

# 3. Build SDK + app
echo ""
echo "--- Building SDK & app ---"
cd "$WEB_DIR/../.."
pnpm exec turbo build --filter=@marshant/sdk
cd "$WEB_DIR"
pnpm exec next build

# 4. Start app in production mode
echo ""
echo "--- Starting app on port 3001 ---"
pnpm exec next start -p 3001 &
APP_PID=$!

# 5. Wait for app to be ready
echo "Waiting for app..."
for i in $(seq 1 60); do
  if curl -sf http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "App is ready."
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "App failed to start within 60 seconds."
    exit 1
  fi
  sleep 1
done

# 6. Run tests
echo ""
echo "--- Running E2E tests ---"
pnpm exec vitest run --config vitest.e2e.config.ts
