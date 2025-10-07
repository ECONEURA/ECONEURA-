#!/bin/bash
# VALIDATE ENVIRONMENT: Check if development environment is ready
# Version: 1.0.0

set -e

echo "🔍 VALIDACIÓN DEL ENTORNO DE DESARROLLO"
echo "======================================="

# Required tools
REQUIRED_TOOLS=("node" "npm" "pnpm" "docker" "docker-compose")
MISSING_TOOLS=()

for tool in "${REQUIRED_TOOLS[@]}"; do
    if command -v "$tool" >/dev/null 2>&1; then
        VERSION=$($tool --version 2>/dev/null | head -1)
        echo "✅ $tool: $VERSION"
    else
        echo "❌ $tool: NO ENCONTRADO"
        MISSING_TOOLS+=("$tool")
    fi
done

# Check Node.js version if available
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version | sed 's/v//')
    REQUIRED_VERSION="20.0.0"
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
        echo "✅ Node.js version >= 20.0.0"
    else
        echo "❌ Node.js version too old: $NODE_VERSION (requires >= 20.0.0)"
    fi
fi

# Check if in correct directory
if [ -f "package.json" ] && [ -f "pnpm-workspace.yaml" ]; then
    echo "✅ Correct project directory"
else
    echo "❌ Not in correct project directory"
fi

# Summary
if [ ${#MISSING_TOOLS[@]} -eq 0 ]; then
    echo
    echo "🎉 ENTORNO LISTO PARA DESARROLLO"
    exit 0
else
    echo
    echo "⚠️ HERRAMIENTAS FALTANTES: ${MISSING_TOOLS[*]}"
    echo "💡 Ejecuta: devcontainer o docker-compose up"
    exit 1
fi
