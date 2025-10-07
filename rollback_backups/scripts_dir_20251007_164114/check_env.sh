#!/usr/bin/env bash
# Simple helper to verify Node and pnpm are available for contributors
set -euo pipefail

MISSING=0
echo "Checking developer environment..."

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node not found on PATH."
  echo "  - Install Node.js (recommended LTS). Visit https://nodejs.org/ or use your distro package manager."
  MISSING=1
else
  echo "node: $(node -v)"
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "ERROR: pnpm not found on PATH."
  echo "  - Install pnpm: https://pnpm.io/installation"
  echo "  - Or use: npm i -g pnpm"
  MISSING=1
else
  echo "pnpm: $(pnpm -v)"
fi

if [ $MISSING -ne 0 ]; then
  echo "\nQuick fix examples:"
  echo "  curl -fsSL https://get.pnpm.io/install.sh | sh -"
  echo "  # or via npm (if npm exists): npm i -g pnpm"
  exit 2
fi

echo "All required tools present. You can run 'pnpm -w test' or the project test tasks." 
