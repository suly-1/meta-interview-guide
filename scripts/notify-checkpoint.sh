#!/usr/bin/env bash
# notify-checkpoint.sh
# Fires a push notification to the project owner after a Manus checkpoint is saved.
# Usage: ./scripts/notify-checkpoint.sh "Description of what changed" "version-id-optional"
#
# Requires ADMIN_SECRET_TOKEN to be set in the environment (auto-injected by Manus).
# The server must be running at SERVER_URL (defaults to http://localhost:3000).

set -euo pipefail

DESCRIPTION="${1:-New changes are ready to publish}"
VERSION_ID="${2:-}"
SERVER_URL="${SERVER_URL:-http://localhost:3000}"

# Get token from the running tsx process if not already in env
if [ -z "${ADMIN_SECRET_TOKEN:-}" ]; then
  PID=$(pgrep -f "tsx watch" 2>/dev/null | head -1 || true)
  if [ -n "$PID" ]; then
    ADMIN_SECRET_TOKEN=$(cat /proc/$PID/environ 2>/dev/null | tr '\0' '\n' | grep "^ADMIN_SECRET_TOKEN=" | cut -d= -f2 || true)
  fi
fi

TOKEN="${ADMIN_SECRET_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "[notify-checkpoint] ERROR: ADMIN_SECRET_TOKEN is not set. Cannot send notification."
  exit 1
fi

# Build JSON payload (tRPC v11 batch format)
if [ -n "$VERSION_ID" ]; then
  PAYLOAD=$(printf '{"0":{"json":{"description":"%s","versionId":"%s"}}}' "$DESCRIPTION" "$VERSION_ID")
else
  PAYLOAD=$(printf '{"0":{"json":{"description":"%s"}}}' "$DESCRIPTION")
fi

echo "[notify-checkpoint] Sending checkpoint-ready notification..."

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "x-admin-token: ${TOKEN}" \
  "${SERVER_URL}/api/trpc/system.checkpointReady?batch=1" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo "[notify-checkpoint] ✅ Notification sent (HTTP $HTTP_CODE)"
else
  echo "[notify-checkpoint] ⚠️  Notification may have failed (HTTP $HTTP_CODE): $BODY"
  # Don't exit with error — notification failure should never block the workflow
fi
