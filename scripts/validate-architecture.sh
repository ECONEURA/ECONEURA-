#!/usr/bin/env bash
# ECONEURA - Architecture Validation Script
# Verifica que las afirmaciones en copilot-instructions.md coincidan con la realidad del código

set -o pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo -e "${BLUE}=== ECONEURA Architecture Validation ===${NC}"
echo ""

PASS=0
FAIL=0
WARN=0

check_pass() {
  echo -e "${GREEN}✅ PASS:${NC} $1"
  ((PASS++))
}

check_fail() {
  echo -e "${RED}❌ FAIL:${NC} $1"
  ((FAIL++))
}

check_warn() {
  echo -e "${YELLOW}⚠️  WARN:${NC} $1"
  ((WARN++))
}

echo -e "${BLUE}1. Directory Structure${NC}"
echo "---"
if [ -d "apps/web" ]; then
  check_pass "apps/web exists"
else
  check_fail "apps/web missing"
fi

if [ -d "apps/cockpit" ]; then
  check_pass "apps/cockpit exists"
else
  check_warn "apps/cockpit missing"
fi

if [ -d "apps/api_py" ]; then
  check_pass "apps/api_py exists"
else
  check_fail "apps/api_py missing"
fi

if [ -f "apps/api_py/server.py" ]; then
  check_pass "apps/api_py/server.py exists"
else
  check_fail "apps/api_py/server.py missing"
fi

if [ -d "apps/api/src" ]; then
  check_warn "apps/api/src exists (copilot-instructions says it shouldn't)"
elif [ -d "apps/api" ]; then
  check_pass "apps/api is empty/stub (as expected)"
else
  check_warn "apps/api doesn't exist at all"
fi

echo ""
echo -e "${BLUE}2. Packages Structure${NC}"
echo "---"
if [ -d "packages/shared" ]; then
  check_pass "packages/shared exists"
else
  check_fail "packages/shared missing"
fi

if [ -d "packages/configs" ]; then
  check_pass "packages/configs exists (plural)"
else
  check_fail "packages/configs missing"
fi

if [ -d "packages/config" ]; then
  check_fail "packages/config exists (should be plural!)"
else
  check_pass "packages/config doesn't exist (correct)"
fi

echo ""
echo -e "${BLUE}3. Agent Routing Configuration${NC}"
echo "---"
if [ -f "packages/config/agent-routing.json" ] || [ -f "packages/configs/agent-routing.json" ]; then
  check_warn "agent-routing.json found (copilot-instructions says it shouldn't exist in repo)"
else
  check_pass "agent-routing.json not in repo (hardcoded in server.py)"
fi

# Check server.py has hardcoded routes
if grep -q 'ROUTES=\[f"neura-{i}"' apps/api_py/server.py 2>/dev/null; then
  check_pass "server.py has hardcoded ROUTES array"
else
  check_fail "server.py doesn't have expected ROUTES array"
fi

# Count expected routes (should be 10: neura-1 to neura-10)
ROUTE_COUNT=$(grep -oP 'range\(1,\K\d+' apps/api_py/server.py 2>/dev/null || echo "0")
if [ "$ROUTE_COUNT" = "11" ]; then
  check_pass "server.py defines 10 routes (neura-1 to neura-10)"
else
  check_warn "server.py route count unexpected: generates neura-1 to neura-$((ROUTE_COUNT-1))"
fi

echo ""
echo -e "${BLUE}4. FastAPI Services${NC}"
echo "---"
NEURA_SERVICES=$(find services/neuras -maxdepth 1 -mindepth 1 -type d 2>/dev/null | wc -l)
if [ "$NEURA_SERVICES" -ge 10 ]; then
  check_pass "Found $NEURA_SERVICES neura services in services/neuras/"
else
  check_warn "Only $NEURA_SERVICES neura services found (expected ~11)"
fi

echo ""
echo -e "${BLUE}5. Coverage Thresholds${NC}"
echo "---"
if grep -q 'statements: 50' vitest.config.ts 2>/dev/null; then
  check_pass "vitest.config.ts has statements: 50 (not 90)"
else
  check_fail "vitest.config.ts coverage thresholds don't match copilot-instructions"
fi

if grep -q 'functions: 75' vitest.config.ts 2>/dev/null; then
  check_pass "vitest.config.ts has functions: 75 (not 80)"
else
  check_fail "vitest.config.ts functions threshold unexpected"
fi

echo ""
echo -e "${BLUE}6. Documentation${NC}"
echo "---"
if [ -f "docs/ARCHITECTURE_REALITY.md" ]; then
  check_pass "docs/ARCHITECTURE_REALITY.md exists"
else
  check_warn "docs/ARCHITECTURE_REALITY.md missing"
fi

if [ -f "README.md" ]; then
  check_pass "README.md exists"
else
  check_fail "README.md missing"
fi

if [ -f ".github/copilot-instructions.md" ]; then
  check_pass ".github/copilot-instructions.md exists"
else
  check_fail "copilot-instructions.md missing"
fi

echo ""
echo -e "${BLUE}7. API Server Validation${NC}"
echo "---"
# Check for required endpoints in server.py
if grep -q '/api/health' apps/api_py/server.py 2>/dev/null; then
  check_pass "server.py implements /api/health endpoint"
else
  check_fail "server.py missing /api/health endpoint"
fi

if grep -q '/api/invoke/' apps/api_py/server.py 2>/dev/null; then
  check_pass "server.py implements /api/invoke/:id endpoint"
else
  check_fail "server.py missing /api/invoke endpoint"
fi

# Check for required headers
if grep -q 'Authorization' apps/api_py/server.py 2>/dev/null; then
  check_pass "server.py checks Authorization header"
else
  check_warn "server.py might not check Authorization"
fi

if grep -q 'X-Correlation-Id' apps/api_py/server.py 2>/dev/null; then
  check_pass "server.py handles X-Correlation-Id header"
else
  check_warn "server.py might not handle X-Correlation-Id"
fi

echo ""
echo -e "${BLUE}=== Summary ===${NC}"
echo "---"
echo -e "Passed:   ${GREEN}$PASS${NC}"
echo -e "Warnings: ${YELLOW}$WARN${NC}"
echo -e "Failed:   ${RED}$FAIL${NC}"
echo ""

if [ $FAIL -gt 0 ]; then
  echo -e "${RED}❌ Validation FAILED${NC}"
  echo "Some critical architecture claims in copilot-instructions.md don't match reality."
  echo "Review the failures above and update documentation or fix the code."
  exit 1
elif [ $WARN -gt 5 ]; then
  echo -e "${YELLOW}⚠️  Validation passed with warnings${NC}"
  echo "Review warnings to ensure copilot-instructions.md is accurate."
  exit 0
else
  echo -e "${GREEN}✅ Validation PASSED${NC}"
  echo "Architecture claims in copilot-instructions.md match the codebase."
  exit 0
fi
