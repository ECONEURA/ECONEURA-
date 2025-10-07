#!/bin/bash

# Monitor de Progreso - Reconstrucción Dev Container ECONEURA
# Versión: 1.0 - 7 Octubre 2025

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}[MONITOR]${NC} === MONITOR DE PROGRESO - RECONSTRUCCIÓN DEV CONTAINER ==="
echo ""

# Función para verificar herramientas
check_tools() {
    local all_good=true

    echo -e "${BLUE}[MONITOR]${NC} Verificando herramientas..."

    # Docker
    if docker --version &>/dev/null 2>&1; then
        echo -e "${GREEN}✅ Docker${NC}"
    else
        echo -e "${RED}❌ Docker${NC}"
        all_good=false
    fi

    # Docker Compose
    if docker-compose --version &>/dev/null 2>&1; then
        echo -e "${GREEN}✅ Docker Compose${NC}"
    else
        echo -e "${RED}❌ Docker Compose${NC}"
        all_good=false
    fi

    # Node.js
    if node --version &>/dev/null 2>&1; then
        echo -e "${GREEN}✅ Node.js${NC}"
    else
        echo -e "${RED}❌ Node.js${NC}"
        all_good=false
    fi

    # pnpm
    if pnpm --version &>/dev/null 2>&1; then
        echo -e "${GREEN}✅ pnpm${NC}"
    else
        echo -e "${RED}❌ pnpm${NC}"
        all_good=false
    fi

    echo ""
    return $([ "$all_good" = true ] && echo 0 || echo 1)
}

# Función para mostrar instrucciones
show_instructions() {
    echo -e "${YELLOW}[MONITOR]${NC} INSTRUCCIONES PARA RECONSTRUCCIÓN MANUAL:"
    echo ""
    echo "1. Presiona Ctrl+Shift+P en VS Code"
    echo "2. Busca: 'Dev Containers: Rebuild Container'"
    echo "3. Selecciona y ejecuta el comando"
    echo "4. Espera 5-10 minutos"
    echo ""
    echo -e "${BLUE}[MONITOR]${NC} Este monitor verificará automáticamente cuando esté listo..."
    echo ""
}

# Función principal
main() {
    echo -e "${BLUE}[MONITOR]${NC} Iniciando monitoreo de reconstrucción..."
    echo ""

    # Verificación inicial
    echo -e "${BLUE}[MONITOR]${NC} Estado inicial:"
    if check_tools; then
        echo -e "${GREEN}[MONITOR]${NC} ¡Todas las herramientas ya están disponibles!"
        echo -e "${GREEN}[MONITOR]${NC} Reconstrucción completada exitosamente."
        echo ""
        echo -e "${BLUE}[MONITOR]${NC} PRÓXIMOS PASOS:"
        echo "1. Ejecutar: ./scripts/start-dev.sh"
        echo "2. Verificar servicios en puertos 3000, 3101, 3102"
        echo "3. Proceder a Fase 2: Limpieza completa"
        exit 0
    fi

    # Mostrar instrucciones
    show_instructions

    # Loop de monitoreo
    local counter=0
    while true; do
        counter=$((counter + 1))
        echo -e "${BLUE}[MONITOR]${NC} Verificación #$counter - $(date '+%H:%M:%S')"

        if check_tools; then
            echo ""
            echo -e "${GREEN}[MONITOR]${NC} 🎉 ¡RECONSTRUCCIÓN COMPLETADA!"
            echo -e "${GREEN}[MONITOR]${NC} Todas las herramientas están disponibles."
            echo ""
            echo -e "${BLUE}[MONITOR]${NC} PRÓXIMOS PASOS:"
            echo "1. Ejecutar validación completa: ./scripts/core/validate-environment.sh"
            echo "2. Iniciar servicios: ./scripts/start-dev.sh"
            echo "3. Verificar health checks en http://localhost:3000"
            echo "4. Proceder a Fase 2: ./scripts/core/prioritized-cleanup.sh"
            echo ""
            echo -e "${GREEN}[MONITOR]${NC} FASE 1 COMPLETADA - ¡Listo para commit 'env-ready-$(date +%Y%m%d)'!"
            exit 0
        fi

        echo -e "${YELLOW}[MONITOR]${NC} Herramientas no listas aún. Esperando..."
        echo ""

        # Esperar 30 segundos antes de siguiente verificación
        sleep 30
    done
}

# Ejecutar
main "$@"