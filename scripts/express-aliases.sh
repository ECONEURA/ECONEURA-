# Express Velocity Mode - Quick Aliases
# Source this file to get instant access to express commands
# Usage: source scripts/express-aliases.sh

# Main aliases
alias ev='./scripts/express-velocity.sh'
alias es='./scripts/express-status.sh'
alias ed='./scripts/express-dev-start.sh'

# Docker shortcuts
alias dc='docker compose -f docker-compose.dev.yml'
alias dcu='docker compose -f docker-compose.dev.yml up -d'
alias dcd='docker compose -f docker-compose.dev.yml down'
alias dcp='docker compose -f docker-compose.dev.yml ps'
alias dcl='docker compose -f docker-compose.dev.yml logs -f'

# Development shortcuts
alias web='pnpm -C apps/web dev'
alias api='pnpm -C apps/api_py dev'

# Utility shortcuts
alias install='pnpm install'
alias clean='rm -rf node_modules && pnpm install'

echo "✅ Express Velocity aliases loaded!"
echo ""
echo "Available commands:"
echo "  ev   → ./scripts/express-velocity.sh (full setup)"
echo "  es   → ./scripts/express-status.sh (status check)"
echo "  ed   → ./scripts/express-dev-start.sh (quick start)"
echo "  dcu  → Start Docker services"
echo "  dcd  → Stop Docker services"
echo "  dcp  → Check Docker services"
echo "  dcl  → View Docker logs"
echo "  web  → Start web app"
echo "  api  → Start API"
echo ""
