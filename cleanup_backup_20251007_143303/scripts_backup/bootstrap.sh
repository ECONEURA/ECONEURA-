#!/usr/bin/env bash
set -euo pipefail
echo "Bootstrapping repository (sh)"
corepack enable
corepack prepare pnpm@8.15.5 --activate
pnpm install --frozen-lockfile
echo "Installing husky hooks"
pnpm dlx husky install || true
echo "Bootstrap complete"
