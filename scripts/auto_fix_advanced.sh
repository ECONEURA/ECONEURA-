#!/usr/bin/env bash
set -euo pipefail

LOGDIR="./.automation_logs"
mkdir -p "$LOGDIR"
echo "Advanced auto-fix started" | tee "$LOGDIR/auto_fix_advanced.log"

PNPM_LOG="pnpm-install.log"
VITEST_LOG="vitest.log"
CHANGED=false

function push_changes() {
  git add -A || true
  if ! git diff --staged --quiet; then
    git commit -m "chore(ci): automated heuristic fixes" || true
    if [ -n "${AUTH_TOKEN:-}" ]; then
      git remote set-url origin https://x-access-token:${AUTH_TOKEN}@github.com/${GITHUB_REPOSITORY}
    fi
    git push origin HEAD:$(echo ${GITHUB_REF#refs/heads/}) || git push || true
  else
    echo "No staged changes to commit"
  fi
}

if [ -f "$PNPM_LOG" ]; then
  if grep -E "(ETIMEDOUT|ENOTFOUND|EAI_AGAIN|ECONNRESET|ETIMEDOUT|fetch error)" "$PNPM_LOG" -i >/dev/null 2>&1; then
    echo "Detected network/install errors in $PNPM_LOG" | tee -a "$LOGDIR/auto_fix_advanced.log"
    cat > .npmrc <<'EOF'
fetch-retries=5
fetch-retry-factor=2
network-concurrency=1
registry=https://registry.npmjs.org/
EOF
    echo ".npmrc created to improve install resilience" | tee -a "$LOGDIR/auto_fix_advanced.log"
    CHANGED=true
    pnpm install --frozen-lockfile 2>&1 | tee "$LOGDIR/pnpm-install-retry.log" || true
  fi
fi

#!/usr/bin/env bash
set -euo pipefail

LOGDIR="./.automation_logs"
mkdir -p "$LOGDIR"
echo "Advanced auto-fix started" | tee "$LOGDIR/auto_fix_advanced.log"

PNPM_LOG="pnpm-install.log"
VITEST_LOG="vitest.log"
CHANGED=false

function push_changes() {
  git add -A || true
  if ! git diff --staged --quiet; then
    git commit -m "chore(ci): automated heuristic fixes" || true
    if [ -n "${AUTH_TOKEN:-}" ]; then
      git remote set-url origin https://x-access-token:${AUTH_TOKEN}@github.com/${GITHUB_REPOSITORY}
    fi
    # Try to push to the current branch; if GITHUB_REF is not set, fall back to simple git push
    if [ -n "${GITHUB_REF:-}" ]; then
      git push origin HEAD:$(echo ${GITHUB_REF#refs/heads/}) || git push || true
    else
      git push || true
    fi
  else
    echo "No staged changes to commit"
  fi
}

if [ -f "$PNPM_LOG" ]; then
  if grep -E "(ETIMEDOUT|ENOTFOUND|EAI_AGAIN|ECONNRESET|ETIMEDOUT|fetch error)" "$PNPM_LOG" -i >/dev/null 2>&1; then
    echo "Detected network/install errors in $PNPM_LOG" | tee -a "$LOGDIR/auto_fix_advanced.log"
    cat > .npmrc <<'EOF'
fetch-retries=5
fetch-retry-factor=2
network-concurrency=1
registry=https://registry.npmjs.org/
EOF
    echo ".npmrc created to improve install resilience" | tee -a "$LOGDIR/auto_fix_advanced.log"
    CHANGED=true
    if command -v pnpm >/dev/null 2>&1; then
      pnpm install --frozen-lockfile 2>&1 | tee "$LOGDIR/pnpm-install-retry.log" || true
    else
      echo "pnpm not found; skipping retry install" | tee -a "$LOGDIR/auto_fix_advanced.log"
    fi
  fi
fi

if [ -f "$VITEST_LOG" ]; then
  if grep -E "(OutOfMemory|Cannot allocate memory|worker crashed|worker exited|Worker process exited|EPERM|EACCES)" "$VITEST_LOG" -i >/dev/null 2>&1; then
    echo "Detected possible vitest worker/memory issues" | tee -a "$LOGDIR/auto_fix_advanced.log"
    # Add a conservative CI-only test script that disables threads and adds retries
    cat > /tmp/add_test_fast_ci.js <<'JS'
const fs=require('fs');
const p='package.json';
const pkg=JSON.parse(fs.readFileSync(p,'utf8'));
pkg.scripts = pkg.scripts || {};
if(!pkg.scripts['test:fast:ci']){
  pkg.scripts['test:fast:ci']='vitest run --reporter dot --threads=false --retry=2';
  fs.writeFileSync(p, JSON.stringify(pkg, null, 2));
  console.log('Added test:fast:ci to package.json');
}
JS
    if command -v node >/dev/null 2>&1; then
      node /tmp/add_test_fast_ci.js || true
    else
      echo "node not found; skipping package.json modification" | tee -a "$LOGDIR/auto_fix_advanced.log"
    fi
    CHANGED=true
  fi
fi

# Run eslint --fix as a general cleanup
if command -v pnpm >/dev/null 2>&1; then
  pnpm -w run lint:fix 2>&1 | tee "$LOGDIR/eslint-fix.log" || true
  if [ -n "$(git status --porcelain)" ]; then
    echo "ESLint fixed some files" | tee -a "$LOGDIR/auto_fix_advanced.log"
    CHANGED=true
  else
    echo "No changes from eslint --fix" | tee -a "$LOGDIR/auto_fix_advanced.log"
  fi
fi

if [ "$CHANGED" = true ]; then
  echo "Staging and pushing changes" | tee -a "$LOGDIR/auto_fix_advanced.log"
  push_changes
else
  echo "No heuristic changes applied" | tee -a "$LOGDIR/auto_fix_advanced.log"
fi

echo "Advanced auto-fix finished" | tee -a "$LOGDIR/auto_fix_advanced.log"
exit 0
  echo "Staging and pushing changes" | tee -a "$LOGDIR/auto_fix_advanced.log"
  push_changes
else
  echo "No heuristic changes applied" | tee -a "$LOGDIR/auto_fix_advanced.log"
fi

echo "Advanced auto-fix finished" | tee -a "$LOGDIR/auto_fix_advanced.log"
exit 0
