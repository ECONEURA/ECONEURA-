echo "Auto-fix helper: attempting safe automatic fixes (eslint --fix) and reporting results"
echo "Running eslint --fix across workspace..."
echo "Running typecheck (no emit)"
echo "Running quick tests (fast)"
echo "Auto-fix complete. Review changed files and commit if acceptable."
echo "Auto-fix: attempting quick fixes (lint --fix, then typecheck smoke)"
pnpm install --frozen-lockfile
echo "Running lint --fix across workspace..."
echo "Running typecheck (noEmit)..."
echo "Running fast tests..."
echo "Auto-fix completed. Inspect outputs above and commit fixes if needed."
#!/usr/bin/env bash
set -euo pipefail

LOGDIR="./.automation_logs"
mkdir -p "$LOGDIR"
echo "Auto-fix started: logs -> $LOGDIR"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found. Attempting to enable via corepack..." | tee "$LOGDIR/auto_fix.log"
  if command -v corepack >/dev/null 2>&1; then
    corepack enable || true
    corepack prepare pnpm@8.15.5 --activate || true
  fi
fi

echo "Installing dependencies (logs to pnpm-install.log)"
pnpm install --frozen-lockfile 2>&1 | tee "$LOGDIR/pnpm-install.log" || true

CHANGED=false

echo "Running eslint --fix (logs to eslint.log)"
pnpm -w run lint:fix 2>&1 | tee "$LOGDIR/eslint.log" || true

# If eslint produced fixes, check git status
if ! git status --porcelain | grep -q '^'; then
  echo "No changes after eslint --fix" | tee -a "$LOGDIR/auto_fix.log"
else
  echo "Detected changes after eslint --fix" | tee -a "$LOGDIR/auto_fix.log"
  CHANGED=true
fi

echo "Running typecheck (logs to tsc.log)"
pnpm -w run typecheck 2>&1 | tee "$LOGDIR/tsc.log" || true

echo "Running fast tests (logs to vitest.log)"
pnpm -w run test:fast 2>&1 | tee "$LOGDIR/vitest.log" || true

echo "Auto-fix finished" | tee -a "$LOGDIR/auto_fix.log"

if [ "$CHANGED" = true ]; then
  echo "Files changed by auto-fix. Staging commit..." | tee -a "$LOGDIR/auto_fix.log"
  git add -A || true
  if ! git diff --staged --quiet; then
    git commit -m "chore(ci): automated lint fixes" || true
    echo "Committed fixes" | tee -a "$LOGDIR/auto_fix.log"
  else
    echo "No staged changes to commit" | tee -a "$LOGDIR/auto_fix.log"
  fi
else
  echo "No changes detected by auto-fix" | tee -a "$LOGDIR/auto_fix.log"
fi

echo "Auto-fix script completed. Logs in $LOGDIR"
exit 0
