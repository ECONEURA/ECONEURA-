#!/bin/bash

# Script automatizado para reconstruir el dev container ECONEURA
# Versión: 1.0 - 7 Octubre 2025
# Autor: GitHub Copilot

set -e  # Salir en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes coloreados
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Función para verificar si estamos en VS Code
check_vscode_environment() {
    if [ -z "$VSCODE_PID" ]; then
        print_error "Este script debe ejecutarse desde VS Code"
        print_error "Abre el proyecto en VS Code y ejecuta: ./scripts/auto-rebuild-devcontainer.sh"
        exit 1
    fi
}

# Función para verificar configuración del dev container
verify_devcontainer_config() {
    print_status "Verificando configuración del dev container..."

    if [ ! -f ".devcontainer/devcontainer.json" ]; then
        print_error "Archivo .devcontainer/devcontainer.json no encontrado"
        exit 1
    fi

    if [ ! -f ".devcontainer/Dockerfile" ]; then
        print_error "Archivo .devcontainer/Dockerfile no encontrado"
        exit 1
    fi

    print_success "Configuración del dev container verificada"
}

# Función para ejecutar comando de VS Code
execute_vscode_command() {
    local command_id="$1"
    local command_name="$2"

    print_status "Ejecutando comando VS Code: $command_name"

    # Usar el comando de VS Code para reconstruir el contenedor
    if command -v code &> /dev/null; then
        code --command "$command_id" 2>/dev/null || {
            print_warning "No se pudo ejecutar comando automáticamente"
            print_warning "Ejecuta manualmente: $command_name"
            return 1
        }
    else
        print_error "Comando 'code' no encontrado"
        print_error "Asegúrate de tener VS Code CLI instalado"
        return 1
    fi
}

# Función para reconstruir dev container
rebuild_devcontainer() {
    print_status "Iniciando reconstrucción del dev container..."

    # Comando para reconstruir contenedor de desarrollo
    # En VS Code, el comando es: Dev Containers: Rebuild Container
    execute_vscode_command "dev-containers.rebuildContainer" "Dev Containers: Rebuild Container" || {
        print_warning "Reconstrucción manual requerida"
        show_manual_instructions
        return 1
    }

    print_success "Comando de reconstrucción enviado a VS Code"
}

# Función para mostrar instrucciones manuales
show_manual_instructions() {
    echo ""
    print_warning "INSTRUCCIONES MANUALES:"
    echo "1. Presiona Ctrl+Shift+P (o Cmd+Shift+P en Mac)"
    echo "2. Escribe: 'Dev Containers: Rebuild Container'"
    echo "3. Selecciona la opción y presiona Enter"
    echo "4. Espera 5-10 minutos mientras se reconstruye"
    echo ""
}

# Función para esperar y verificar reconstrucción
wait_for_rebuild() {
    print_status "Esperando reconstrucción del contenedor..."
    print_status "Esto puede tomar 5-10 minutos..."

    # Esperar un poco para que inicie el proceso
    sleep 5

    # Mostrar mensaje de espera
    echo ""
    print_status "MONITOREA EL PROGRESO EN:"
    echo "• Terminal de VS Code (mensajes de Docker)"
    echo "• Barra de estado inferior (progreso del contenedor)"
    echo ""

    # Esperar input del usuario
    echo -n "Presiona Enter cuando la reconstrucción haya terminado..."
    read -r
}

# Función para verificar post-reconstrucción
verify_post_rebuild() {
    print_status "Verificando herramientas post-reconstrucción..."

    local all_good=true

    # Verificar Docker
    if docker --version &>/dev/null; then
        print_success "Docker: ✅ Disponible"
    else
        print_error "Docker: ❌ NO disponible"
        all_good=false
    fi

    # Verificar Docker Compose
    if docker-compose --version &>/dev/null; then
        print_success "Docker Compose: ✅ Disponible"
    else
        print_error "Docker Compose: ❌ NO disponible"
        all_good=false
    fi

    # Verificar Node.js
    if node --version &>/dev/null; then
        print_success "Node.js: ✅ Disponible"
    else
        print_error "Node.js: ❌ NO disponible"
        all_good=false
    fi

    # Verificar pnpm
    if pnpm --version &>/dev/null; then
        print_success "pnpm: ✅ Disponible"
    else
        print_error "pnpm: ❌ NO disponible"
        all_good=false
    fi

    if [ "$all_good" = true ]; then
        print_success "¡Todas las herramientas están disponibles!"
        return 0
    else
        print_error "Algunas herramientas no están disponibles"
        print_warning "Verifica la reconstrucción del contenedor"
        return 1
    fi
}

# Función para ejecutar validación completa
run_full_validation() {
    print_status "Ejecutando validación completa del entorno..."

    if [ -f "./scripts/core/validate-environment.sh" ]; then
        bash ./scripts/core/validate-environment.sh
    else
        print_warning "Script de validación no encontrado"
        print_status "Creando validación básica..."

        # Verificación básica
        echo "=== VALIDACIÓN BÁSICA DEL ENTORNO ==="
        docker --version && echo "✅ Docker OK" || echo "❌ Docker FAIL"
        docker-compose --version && echo "✅ Docker Compose OK" || echo "❌ Docker Compose FAIL"
        node --version && echo "✅ Node.js OK" || echo "❌ Node.js FAIL"
        pnpm --version && echo "✅ pnpm OK" || echo "❌ pnpm FAIL"
    fi
}

# Función principal
main() {
    echo ""
    print_status "=== RECONSTRUCCIÓN AUTOMATIZADA DEL DEV CONTAINER ECONEURA ==="
    echo ""

    # Verificar entorno
    check_vscode_environment

    # Verificar configuración
    verify_devcontainer_config

    # Preguntar confirmación
    echo ""
    print_warning "¿Estás listo para reconstruir el dev container?"
    echo "Esto cerrará la sesión actual y reconstruirá el entorno."
    echo ""
    read -p "Presiona Enter para continuar o Ctrl+C para cancelar..."

    # Iniciar reconstrucción
    rebuild_devcontainer

    # Esperar reconstrucción
    wait_for_rebuild

    # Verificar resultado
    if verify_post_rebuild; then
        print_success "¡Reconstrucción exitosa!"
        echo ""
        print_status "PRÓXIMOS PASOS:"
        echo "1. Ejecutar: ./scripts/start-dev.sh"
        echo "2. Verificar servicios en:"
        echo "   • http://localhost:3000 (Cockpit web)"
        echo "   • http://localhost:3101 (NEURA API)"
        echo "   • http://localhost:3102 (Agents API)"
        echo "3. Ejecutar limpieza completa"
        echo ""
    else
        print_error "Reconstrucción incompleta"
        print_status "Revisa los logs y vuelve a intentar"
        exit 1
    fi
}

# Ejecutar función principal
main "$@"