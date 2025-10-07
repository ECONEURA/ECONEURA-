#!/usr/bin/env bash
# Consolidated cleanup script for ECONEURA monorepo
# Combines functionality from clean.sh + clean-cache.sh
set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_section() {
    echo -e "\n${BLUE}$1${NC}"
}

echo "🧹 ECONEURA Cleanup - Consolidated"
echo "===================================="

# 1. Build outputs cleanup
print_section "Cleaning build outputs..."
rm -rf dist || true
rm -rf .next coverage || true
rm -rf apps/*/.next apps/*/coverage apps/*/dist || true
rm -rf packages/*/dist packages/*/coverage || true
print_status "Build outputs cleaned"

# 2. Cache cleanup
print_section "Cleaning caches..."

# Node.js cache
if [ -d "node_modules/.cache" ]; then
    rm -rf node_modules/.cache
    print_status "Node.js cache cleaned"
fi

# General cache directories
rm -rf .cache apps/*/.cache packages/*/.cache || true
print_status "General caches cleaned"

# TypeScript build info
find . -name "*.tsbuildinfo" -delete 2>/dev/null || true
print_status "TypeScript build info cleaned"

# ESLint cache
if [ -d ".eslintcache" ]; then
    rm -rf .eslintcache
    print_status "ESLint cache cleaned"
fi

# 3. Logs cleanup
print_section "Cleaning logs..."
find . -name "*.log" -mtime +7 -delete 2>/dev/null || true
print_status "Old logs cleaned (>7 days)"

# 4. Summary
print_section "Cleanup Summary"
echo "• Build outputs: ✅ Removed"
echo "• Caches: ✅ Cleaned"
echo "• TypeScript info: ✅ Deleted"
echo "• Old logs: ✅ Removed"

echo -e "\n${GREEN}🎉 Cleanup completed successfully${NC}"
