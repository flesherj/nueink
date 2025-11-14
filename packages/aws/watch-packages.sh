#!/bin/bash
# Watch package changes and touch Lambda handlers to trigger sandbox rebuild
#
# Usage: ./watch-packages.sh
#
# Run this in a separate terminal alongside `yarn sandbox:dev`

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Watching for package changes..."
echo "When packages change, Lambda handlers will be touched to trigger rebuild"
echo ""

# Check if fswatch is installed
if ! command -v fswatch &> /dev/null; then
  echo "Error: fswatch not found. Install with: brew install fswatch"
  exit 1
fi

# Watch for changes in packages
fswatch -o \
  "$REPO_ROOT/packages/core" \
  "$REPO_ROOT/packages/ynab" \
  "$REPO_ROOT/packages/plaid" | while read change; do
  echo "[$(date '+%H:%M:%S')] Package change detected, triggering Lambda rebuild..."

  # Touch all Lambda handlers to trigger rebuild
  touch "$SCRIPT_DIR/amplify/functions/financial/connect/handler.ts"
  touch "$SCRIPT_DIR/amplify/functions/financial/sync/handler.ts"

  echo "[$(date '+%H:%M:%S')] Lambda handlers touched"
done
