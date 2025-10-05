#!/usr/bin/env bash
set -euo pipefail

echo "Auto-fix helper: attempting safe automatic fixes (eslint --fix) and reporting results"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found. Please install pnpm (see scripts/setup_dev_env.sh)" >&2
  exit 2
fi

echo "Running eslint --fix across workspace..."
pnpm -w run lint:fix || echo "eslint --fix returned non-zero; check output"

echo "Running typecheck (no emit)"
pnpm -w run typecheck || echo "typecheck failed"

echo "Running quick tests (fast)"
pnpm -w run test:fast || echo "some tests failed"

echo "Auto-fix complete. Review changed files and commit if acceptable."
echo "Suggested next steps: git add -A && git commit -m 'fix: automated lint fixes' && git push"
#!/usr/bin/env bash
set -euo pipefail

echo "Auto-fix: attempting quick fixes (lint --fix, then typecheck smoke)"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found. Run setup_dev_env.sh first or install pnpm."
  exit 2
fi

pnpm install --frozen-lockfile

echo "Running lint --fix across workspace..."
pnpm -w run lint:fix || true

echo "Running typecheck (noEmit)..."
pnpm -w run typecheck || true

echo "Running fast tests..."
pnpm -w run test:fast || true

echo "Auto-fix completed. Inspect outputs above and commit fixes if needed."
