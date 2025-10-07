#!/bin/bash

# Reconstrucción Rápida del Dev Container ECONEURA
# Versión: 1.0 - 7 Octubre 2025
# Uso: rebuild-dev-quick

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}[REBUILD-QUICK]${NC} Iniciando reconstrucción rápida del dev container..."

# Verificar que estamos en el directorio correcto
if [ ! -f ".devcontainer/devcontainer.json" ]; then
    echo -e "${RED}[ERROR]${NC} No estás en el directorio raíz de ECONEURA"
    echo -e "${YELLOW}[INFO]${NC} Ejecuta: cd /workspaces/ECONEURA-"
    exit 1
fi

# Verificar VS Code
if [ -z "$VSCODE_PID" ]; then
    echo -e "${RED}[ERROR]${NC} Debes ejecutar esto desde VS Code"
    exit 1
fi

echo -e "${BLUE}[REBUILD-QUICK]${NC} Ejecutando comando de reconstrucción..."

# Ejecutar reconstrucción usando VS Code CLI si está disponible
if command -v code &> /dev/null; then
    code --command "dev-containers.rebuildContainer" 2>/dev/null && {
        echo -e "${GREEN}[SUCCESS]${NC} Comando enviado. Espera la reconstrucción..."
        echo -e "${YELLOW}[INFO]${NC} Monitorea el progreso en la barra de estado"
        exit 0
    }
fi

# Fallback a instrucciones manuales
echo -e "${YELLOW}[FALLBACK]${NC} No se pudo automatizar completamente."
echo -e "${BLUE}[MANUAL]${NC} Presiona Ctrl+Shift+P y busca: 'Dev Containers: Rebuild Container'"