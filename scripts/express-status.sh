#!/bin/bash
# EXPRESS STATUS DASHBOARD - Real-time project status
# Version: 1.0.0

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

clear

echo -e "${BOLD}${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║            📊 EXPRESS STATUS DASHBOARD 📊                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# System Status
echo -e "${BOLD}🖥️  SYSTEM STATUS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_tool() {
    local tool_name="$1"
    local command="$2"
    
    echo -n "  $tool_name: "
    if eval "$command" &>/dev/null; then
        local version=$(eval "$command" 2>&1 | head -1)
        echo -e "${GREEN}✓${NC} $version"
    else
        echo -e "${RED}✗ Not available${NC}"
    fi
}

check_tool "Docker      " "docker --version"
check_tool "Docker Compose" "docker-compose --version"
check_tool "Node.js     " "node --version"
check_tool "pnpm        " "pnpm --version"
check_tool "Git         " "git --version"
echo ""

# Repository Status
echo -e "${BOLD}📦 REPOSITORY STATUS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Branch: $(git branch --show-current 2>/dev/null || echo 'unknown')"
echo "  Commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
echo "  Status: $(git status --porcelain | wc -l) files changed"
echo ""

# Project Metrics
echo -e "${BOLD}📈 PROJECT METRICS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# File counts
TS_COUNT=$(find . -name "*.ts" -o -name "*.tsx" 2>/dev/null | grep -v node_modules | wc -l)
JS_COUNT=$(find . -name "*.js" -o -name "*.jsx" 2>/dev/null | grep -v node_modules | wc -l)
PY_COUNT=$(find . -name "*.py" 2>/dev/null | grep -v node_modules | wc -l)
SH_COUNT=$(find . -name "*.sh" 2>/dev/null | grep -v node_modules | wc -l)
TEST_COUNT=$(find . -name "*.test.*" -o -name "*.spec.*" 2>/dev/null | grep -v node_modules | wc -l)

echo "  TypeScript files: $TS_COUNT"
echo "  JavaScript files: $JS_COUNT"
echo "  Python files: $PY_COUNT"
echo "  Shell scripts: $SH_COUNT"
echo "  Test files: $TEST_COUNT"
echo ""

# Size metrics
REPO_SIZE=$(du -sh . 2>/dev/null | awk '{print $1}')
FILE_COUNT=$(find . -type f 2>/dev/null | wc -l)

echo "  Repository size: $REPO_SIZE"
echo "  Total files: $FILE_COUNT"
echo ""

# Docker Services Status
echo -e "${BOLD}🐳 DOCKER SERVICES${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "docker-compose.dev.yml" ]; then
    if docker-compose -f docker-compose.dev.yml ps 2>/dev/null | grep -q "Up"; then
        docker-compose -f docker-compose.dev.yml ps | tail -n +2 | while read line; do
            if echo "$line" | grep -q "Up"; then
                service_name=$(echo "$line" | awk '{print $1}')
                echo -e "  ${GREEN}✓${NC} $service_name"
            else
                service_name=$(echo "$line" | awk '{print $1}')
                echo -e "  ${RED}✗${NC} $service_name"
            fi
        done
    else
        echo -e "  ${YELLOW}⊘${NC} No services running"
    fi
else
    echo -e "  ${YELLOW}⊘${NC} docker-compose.dev.yml not found"
fi
echo ""

# Node Modules Status
echo -e "${BOLD}📚 DEPENDENCIES${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "node_modules" ]; then
    MODULE_SIZE=$(du -sh node_modules 2>/dev/null | awk '{print $1}')
    MODULE_COUNT=$(find node_modules -maxdepth 2 -type d 2>/dev/null | wc -l)
    echo -e "  ${GREEN}✓${NC} node_modules: $MODULE_SIZE ($MODULE_COUNT packages)"
else
    echo -e "  ${RED}✗${NC} node_modules not installed"
fi

if [ -f "pnpm-lock.yaml" ]; then
    echo -e "  ${GREEN}✓${NC} pnpm-lock.yaml present"
else
    echo -e "  ${YELLOW}⊘${NC} pnpm-lock.yaml missing"
fi
echo ""

# Quick Actions
echo -e "${BOLD}⚡ QUICK ACTIONS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ./scripts/express-velocity.sh    # Run full velocity check"
echo "  pnpm install                     # Install dependencies"
echo "  docker-compose -f docker-compose.dev.yml up -d  # Start services"
echo "  docker-compose -f docker-compose.dev.yml down   # Stop services"
echo "  pnpm -C apps/web dev             # Start web app"
echo ""

echo -e "${BOLD}${GREEN}✓ Status check complete${NC}"
echo ""
