#!/bin/bash

# Verificación Rápida Post-Reconstrucción ECONEURA
# Versión: 1.0 - 7 Octubre 2025
# Uso: ./scripts/verify-rebuild.sh

set -e

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}[VERIFY-REBUILD]${NC} === VERIFICACIÓN POST-RECONSTRUCCIÓN ECONEURA ==="
echo ""

# Función para verificar herramienta
check_tool() {
    local tool="$1"
    local command="$2"

    echo -n "🔍 Verificando $tool... "
    if eval "$command" &>/dev/null; then
        echo -e "${GREEN}✅ DISPONIBLE${NC}"
        return 0
    else
        echo -e "${RED}❌ NO DISPONIBLE${NC}"
        return 1
    fi
}

# Verificar herramientas críticas
echo "📋 VERIFICACIÓN DE HERRAMIENTAS:"
echo ""

check_tool "Docker" "docker --version"
check_tool "Docker Compose" "docker-compose --version"
check_tool "Node.js" "node --version"
check_tool "pnpm" "pnpm --version"

echo ""
echo "🔬 EJECUTANDO VALIDACIÓN COMPLETA DEL ENTORNO..."
echo ""

# Ejecutar validación completa
if [ -f "./scripts/core/validate-environment.sh" ]; then
    bash ./scripts/core/validate-environment.sh
else
    echo -e "${YELLOW}[WARNING]${NC} Script de validación no encontrado"
fi

echo ""
echo "🎯 PRÓXIMOS PASOS SI TODO ESTÁ VERDE:"
echo ""
echo "1. 🚀 Iniciar servicios ECONEURA:"
echo "   ./scripts/start-dev.sh"
echo ""
echo "2. 🌐 Verificar health checks:"
echo "   • Cockpit Web: http://localhost:3000"
echo "   • NEURA API: http://localhost:3101"
echo "   • Agents API: http://localhost:3102"
echo ""
echo "3. ✅ Si todo funciona, proceder a Fase 2:"
echo "   ./scripts/core/prioritized-cleanup.sh"
echo ""
echo -e "${GREEN}[SUCCESS]${NC} Verificación completada. Revisa los resultados arriba."