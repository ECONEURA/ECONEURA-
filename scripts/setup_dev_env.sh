#!/usr/bin/env bash
set -euo pipefail

# setup_dev_env.sh
# Convenience script to install Node 20 (LTS) and pnpm 8.15.5 on common OSes.
# Run this script locally (not inside restricted containers) with appropriate privileges.

print_help(){
  cat <<'EOF'
Usage: sudo ./scripts/setup_dev_env.sh [os]

Supported values for [os]: debian | ubuntu | mac | alpine | windows

Examples:
  sudo ./scripts/setup_dev_env.sh debian
  ./scripts/setup_dev_env.sh mac

If you are on Windows, run the PowerShell commands in the README instead.
EOF
}

OS=${1:-}
if [ -z "$OS" ]; then
  print_help
  exit 1
fi

echo "Setup requested for: $OS"

case "$OS" in
  debian|ubuntu)
    echo "Installing Node 20 via NodeSource..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs build-essential curl || true
    echo "Enabling corepack and preparing pnpm@8.15.5"
    corepack enable || true
    corepack prepare pnpm@8.15.5 --activate || true
    ;;

  mac)
    echo "macOS detected. Installing Node 20 with Homebrew (requires brew)."
    if ! command -v brew >/dev/null 2>&1; then
      echo "Homebrew not found. Install it first: https://brew.sh"
      exit 1
    fi
    brew install node@20 || true
    corepack enable || true
    corepack prepare pnpm@8.15.5 --activate || true
    ;;

  alpine)
    echo "Alpine Linux: installing nodejs and npm via apk (requires root)."
    apk update || true
    apk add --no-cache nodejs npm build-base curl git ca-certificates openssl || true
    npm i -g pnpm@8.15.5 || true
    ;;

  windows)
    echo "Windows: run these in an elevated PowerShell (admin):"
    echo "winget install OpenJS.NodeJS.20"
    echo "corepack enable; corepack prepare pnpm@8.15.5 --activate"
    exit 0
    ;;

  *)
    echo "Unsupported OS: $OS" >&2
    print_help
    exit 2
    ;;
esac

echo "--- verification ---"
echo "node: " $(node -v || true)
echo "npm: " $(npm -v || true)
echo "pnpm: " $(pnpm -v || true)

cat <<'EOF'
Done. Next steps (run after install):
  ./scripts/check_env.sh
  pnpm install --frozen-lockfile
  pnpm run bootstrap
  pnpm -w run lint
  pnpm -w run typecheck
  pnpm -w run test:fast

If any command fails, paste the terminal output and I will help fix it.
EOF
