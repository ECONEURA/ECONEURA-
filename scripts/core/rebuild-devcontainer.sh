#!/bin/bash
# REBUILD DEVCONTAINER: Rebuild the development container with Docker support
# Version: 1.0.0

set -e

echo "🔄 RECONSTRUYENDO DEV CONTAINER ECONEURA"
echo "========================================"

echo "�� Verificando configuración..."
if [ ! -f ".devcontainer/devcontainer.json" ]; then
    echo "❌ Error: .devcontainer/devcontainer.json no encontrado"
    exit 1
fi

if [ ! -f ".devcontainer/Dockerfile" ]; then
    echo "❌ Error: .devcontainer/Dockerfile no encontrado"
    exit 1
fi

echo "✅ Archivos de configuración encontrados"

echo
echo "🔧 Instrucciones para reconstruir el dev container:"
echo "=================================================="
echo
echo "1. 🔄 Cerrar VS Code completamente"
echo
echo "2. 🐳 Abrir VS Code y usar Command Palette:"
echo "   Ctrl+Shift+P → 'Dev Containers: Rebuild Container'"
echo
echo "3. ⏳ Esperar a que se reconstruya el contenedor (puede tomar varios minutos)"
echo
echo "4. ✅ Una vez reconstruido, verificar que Docker esté disponible:"
echo "   docker --version"
echo "   docker-compose --version"
echo
echo "5. 🚀 Iniciar servicios de desarrollo:"
echo "   ./scripts/start-dev.sh"
echo
echo "📝 Notas importantes:"
echo "- El contenedor ahora incluye Docker-in-Docker"
echo "- Se montará el socket de Docker del host"
echo "- Los puertos 3000, 3101, 3102, 5432, 6379 estarán forwardeados"
echo
echo "⚠️  Si hay problemas, alternativa: usar Docker Desktop localmente"
