#!/bin/bash
# PROGRESS METRICS: Track cleanup and development progress
# Version: 1.0.0

set -e

echo "📊 MÉTRICAS DE PROGRESO - ECONEURA"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print metric
print_metric() {
    local label="$1"
    local value="$2"
    local status="${3:-}"
    local target="${4:-}"
    
    printf "%-30s : " "$label"
    
    if [ -n "$target" ] && [ "$value" -le "$target" ] 2>/dev/null; then
        echo -e "${GREEN}${value}${NC} (✓ Target: ≤${target})"
    elif [ -n "$status" ]; then
        case "$status" in
            "good") echo -e "${GREEN}${value}${NC}" ;;
            "warning") echo -e "${YELLOW}${value}${NC}" ;;
            "bad") echo -e "${RED}${value}${NC}" ;;
            *) echo "$value" ;;
        esac
    else
        echo "$value"
    fi
}

# REPOSITORY SIZE METRICS
echo
echo "📏 MÉTRICAS DE TAMAÑO"
echo "---------------------"

REPO_SIZE=$(du -sh . | cut -f1)
print_metric "Tamaño total del repo" "$REPO_SIZE" "info"

TOTAL_FILES=$(find . -type f | wc -l)
print_metric "Archivos totales" "$TOTAL_FILES" "info"

# CODE METRICS
echo
echo "💻 MÉTRICAS DE CÓDIGO"
echo "---------------------"

SHELL_SCRIPTS=$(find . -name "*.sh" -type f | wc -l)
if [ "$SHELL_SCRIPTS" -le 10 ]; then
    STATUS="good"
elif [ "$SHELL_SCRIPTS" -le 50 ]; then
    STATUS="warning"
else
    STATUS="bad"
fi
print_metric "Scripts shell" "$SHELL_SCRIPTS" "$STATUS" 10

JS_TS_FILES=$(find . -name "*.ts" -o -name "*.js" | grep -v node_modules | wc -l)
print_metric "Archivos JS/TS" "$JS_TS_FILES" "info"

TEST_FILES=$(find . -name "*.test.*" -o -name "*test*" | grep -v node_modules | wc -l)
print_metric "Archivos de test" "$TEST_FILES" "info"

# CLEANLINESS METRICS
echo
echo "🧹 MÉTRICAS DE LIMPIEZA"
echo "-----------------------"

# Temporary files
TEMP_FILES=$(find . -name "*.tmp" -o -name "*.bak" -o -name "*.log" | wc -l)
if [ "$TEMP_FILES" -eq 0 ]; then
    STATUS="good"
else
    STATUS="bad"
fi
print_metric "Archivos temporales" "$TEMP_FILES" "$STATUS" 0

# Backup directories
BACKUP_DIRS=$(find . -name "*backup*" -type d | wc -l)
if [ "$BACKUP_DIRS" -le 1 ]; then
    STATUS="good"
else
    STATUS="warning"
fi
print_metric "Directorios backup" "$BACKUP_DIRS" "$STATUS" 1

# DEVELOPMENT ENVIRONMENT METRICS
echo
echo "🔧 MÉTRICAS DE ENTORNO"
echo "-----------------------"

# Check tools
check_tool() {
    local tool="$1"
    if command -v "$tool" >/dev/null 2>&1; then
        echo "✅"
    else
        echo "❌"
    fi
}

DOCKER_STATUS=$(check_tool docker)
print_metric "Docker disponible" "$DOCKER_STATUS" "info"

COMPOSE_STATUS=$(check_tool docker-compose)
print_metric "Docker Compose disponible" "$COMPOSE_STATUS" "info"

NODE_STATUS=$(check_tool node)
print_metric "Node.js disponible" "$NODE_STATUS" "info"

if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version | sed 's/v//')
    print_metric "Node.js version" "$NODE_VERSION" "info"
fi

PNPM_STATUS=$(check_tool pnpm)
print_metric "pnpm disponible" "$PNPM_STATUS" "info"

# PROJECT HEALTH METRICS
echo
echo "🏥 MÉTRICAS DE SALUD DEL PROYECTO"
echo "---------------------------------"

# Check if package.json exists
if [ -f "package.json" ]; then
    print_metric "package.json existe" "✅" "good"
else
    print_metric "package.json existe" "❌" "bad"
fi

# Check if pnpm-workspace.yaml exists
if [ -f "pnpm-workspace.yaml" ]; then
    print_metric "Workspace configurado" "✅" "good"
else
    print_metric "Workspace configurado" "❌" "bad"
fi

# Check docker-compose
if [ -f "docker-compose.dev.yml" ]; then
    print_metric "Docker Compose config" "✅" "good"
else
    print_metric "Docker Compose config" "❌" "bad"
fi

# Check documentation
DOC_FILES=$(find docs/ -name "*.md" | wc -l)
if [ "$DOC_FILES" -ge 3 ]; then
    STATUS="good"
else
    STATUS="warning"
fi
print_metric "Archivos de documentación" "$DOC_FILES" "$STATUS" 3

# PROGRESS SUMMARY
echo
echo "📈 RESUMEN DE PROGRESO"
echo "======================="

# Calculate overall score (simplified)
OVERALL_SCORE=0
ISSUES=0

# Size score (smaller is better)
if [ "$TOTAL_FILES" -lt 1000 ]; then
    OVERALL_SCORE=$((OVERALL_SCORE + 25))
elif [ "$TOTAL_FILES" -lt 5000 ]; then
    OVERALL_SCORE=$((OVERALL_SCORE + 15))
else
    ISSUES=$((ISSUES + 1))
fi

# Scripts score
if [ "$SHELL_SCRIPTS" -le 10 ]; then
    OVERALL_SCORE=$((OVERALL_SCORE + 25))
elif [ "$SHELL_SCRIPTS" -le 50 ]; then
    OVERALL_SCORE=$((OVERALL_SCORE + 15))
else
    ISSUES=$((ISSUES + 1))
fi

# Cleanliness score
if [ "$TEMP_FILES" -eq 0 ]; then
    OVERALL_SCORE=$((OVERALL_SCORE + 25))
else
    ISSUES=$((ISSUES + 1))
fi

# Environment score
ENV_SCORE=0
[ "$DOCKER_STATUS" = "✅" ] && ENV_SCORE=$((ENV_SCORE + 1))
[ "$NODE_STATUS" = "✅" ] && ENV_SCORE=$((ENV_SCORE + 1))
[ "$PNPM_STATUS" = "✅" ] && ENV_SCORE=$((ENV_SCORE + 1))

if [ "$ENV_SCORE" -eq 3 ]; then
    OVERALL_SCORE=$((OVERALL_SCORE + 25))
elif [ "$ENV_SCORE" -ge 1 ]; then
    OVERALL_SCORE=$((OVERALL_SCORE + 15))
else
    ISSUES=$((ISSUES + 1))
fi

# Overall assessment
echo "Puntuación general: $OVERALL_SCORE/100"
echo "Problemas críticos: $ISSUES"

if [ "$OVERALL_SCORE" -ge 80 ] && [ "$ISSUES" -eq 0 ]; then
    echo -e "${GREEN}🎉 ESTADO: EXCELENTE - Listo para desarrollo${NC}"
elif [ "$OVERALL_SCORE" -ge 60 ]; then
    echo -e "${YELLOW}⚠️ ESTADO: BUENO - Requiere mejoras menores${NC}"
else
    echo -e "${RED}�� ESTADO: CRÍTICO - Requiere limpieza urgente${NC}"
fi

echo
echo "💡 PRÓXIMOS PASOS RECOMENDADOS:"
echo "1. Resolver problemas críticos ($ISSUES encontrados)"
echo "2. Configurar entorno de desarrollo completo"
echo "3. Ejecutar limpieza priorizada"
echo "4. Verificar que el proyecto compile"
echo "5. Crear documentación técnica completa"
