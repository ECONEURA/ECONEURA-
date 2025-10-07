#!/bin/bash
# EXPRESS DEV START - Start development environment in 10 seconds
# Version: 1.0.0

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║       ⚡ EXPRESS DEV START - 10 Second Setup ⚡           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${BLUE}[1/3]${NC} Starting Docker services..."

# Start services with docker compose v2
if docker compose -f docker-compose.dev.yml up -d 2>&1 | grep -E "(Started|Running|Creating)"; then
    echo -e "${GREEN}✓${NC} Services started with docker compose v2"
elif docker-compose -f docker-compose.dev.yml up -d 2>&1 | grep -E "(Started|Running|Creating)"; then
    echo -e "${GREEN}✓${NC} Services started with docker-compose v1"
else
    echo -e "${BLUE}→${NC} Services may already be running"
fi

echo ""
echo -e "${BLUE}[2/3]${NC} Checking service health..."
sleep 3

# Check services
if docker compose -f docker-compose.dev.yml ps 2>/dev/null | grep -q "Up" || docker-compose -f docker-compose.dev.yml ps 2>/dev/null | grep -q "Up"; then
    echo -e "${GREEN}✓${NC} Services are healthy"
else
    echo -e "${BLUE}→${NC} Services starting (may need more time)"
fi

echo ""
echo -e "${BLUE}[3/3]${NC} Environment ready!"

echo ""
echo -e "${BOLD}${GREEN}✓ Development environment started!${NC}"
echo ""
echo -e "${BOLD}Services available:${NC}"
echo "  • PostgreSQL: localhost:5432"
echo "  • Redis: localhost:6379"
echo "  • Web (when started): http://localhost:3000"
echo "  • API (when started): http://localhost:3101"
echo ""
echo -e "${BOLD}Start application:${NC}"
echo "  Terminal 1: ${CYAN}pnpm -C apps/web dev${NC}      # Web app"
echo "  Terminal 2: ${CYAN}pnpm -C apps/api_py dev${NC}   # API server"
echo ""
echo -e "${BOLD}Quick commands:${NC}"
echo "  Status: ${CYAN}./scripts/express-status.sh${NC}"
echo "  Logs: ${CYAN}docker compose -f docker-compose.dev.yml logs -f${NC}"
echo "  Stop: ${CYAN}docker compose -f docker-compose.dev.yml down${NC}"
echo ""
