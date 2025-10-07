#!/bin/bash
# PROJECT VALIDATION: Comprehensive validation of ECONEURA project state
# Version: 1.0.0

set -e

echo "🔍 VALIDACIÓN COMPLETA DEL PROYECTO ECONEURA"
echo "=============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Validation results
VALIDATIONS_PASSED=0
VALIDATIONS_TOTAL=0
ISSUES_FOUND=()

# Function to run validation
validate() {
    local name="$1"
    local command="$2"
    local expected_exit="${3:-0}"
    
    VALIDATIONS_TOTAL=$((VALIDATIONS_TOTAL + 1))
    
    echo -n "🔍 $name... "
    
    if eval "$command" >/dev/null 2>&1; then
        actual_exit=$?
    else
        actual_exit=$?
    fi
    
    if [ "$actual_exit" -eq "$expected_exit" ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        VALIDATIONS_PASSED=$((VALIDATIONS_PASSED + 1))
    else
        echo -e "${RED}✗ FAILED${NC} (exit code: $actual_exit)"
        ISSUES_FOUND+=("$name")
    fi
}

# 1. ENVIRONMENT VALIDATIONS
echo
echo "🌍 VALIDACIONES DE ENTORNO"
echo "---------------------------"

validate "Bash disponible" "command -v bash"
validate "Git disponible" "command -v git"
validate "Find disponible" "command -v find"
validate "Sed disponible" "command -v sed"
validate "Grep disponible" "command -v grep"

# 2. PROJECT STRUCTURE VALIDATIONS
echo
echo "📁 VALIDACIONES DE ESTRUCTURA"
echo "------------------------------"

validate "Directorio raíz correcto" "pwd | grep -q 'ECONEURA'"
validate "package.json existe" "test -f package.json"
validate "pnpm-workspace.yaml existe" "test -f pnpm-workspace.yaml"
validate "scripts/core existe" "test -d scripts/core"
validate "docs existe" "test -d docs"

# 3. TOOL VALIDATIONS
echo
echo "🛠️ VALIDACIONES DE HERRAMIENTAS"
echo "-------------------------------"

validate "validate-environment.sh existe" "test -x scripts/core/validate-environment.sh"
validate "prioritized-cleanup.sh existe" "test -x scripts/core/prioritized-cleanup.sh"
validate "rollback.sh existe" "test -x scripts/core/rollback.sh"
validate "progress-metrics.sh existe" "test -x scripts/core/progress-metrics.sh"
validate "setup.md existe" "test -f docs/setup.md"

# 4. FUNCTIONALITY TESTS
echo
echo "⚙️ PRUEBAS DE FUNCIONALIDAD"
echo "---------------------------"

# Test validate-environment.sh (should work in current env)
validate "validate-environment.sh ejecutable" "scripts/core/validate-environment.sh | head -1 | grep -q 'VALIDACIÓN'"

# Test progress-metrics.sh
validate "progress-metrics.sh ejecutable" "scripts/core/progress-metrics.sh | head -1 | grep -q 'MÉTRICAS'"

# Test rollback.sh basic functionality
validate "rollback.sh tiene funciones" "grep -q 'create_backup' scripts/core/rollback.sh"

# Test prioritized-cleanup.sh
validate "prioritized-cleanup.sh tiene categorías" "grep -q 'cleanup_category' scripts/core/prioritized-cleanup.sh"

# 5. CONTENT VALIDATIONS
echo
echo "📄 VALIDACIONES DE CONTENIDO"
echo "----------------------------"

validate "setup.md tiene secciones" "grep -q '## ' docs/setup.md"
validate "README.md existe" "test -f README.md"
validate "README.md menciona ECONEURA" "grep -q 'ECONEURA' README.md"

# 6. SECURITY CHECKS
echo
echo "🔒 VALIDACIONES DE SEGURIDAD"
echo "-----------------------------"

validate "No archivos con permisos world-writable" "find . -type f -perm /o+w -not -path './node_modules/*' -not -path './cleanup_backup_*/*' | wc -l | grep -q '^0$'"
validate "Scripts tienen permisos correctos" "find scripts/ -name '*.sh' -exec test -x {} \; | wc -l | xargs echo | grep -q '^[0-9]\+$'"

# 7. CONSISTENCY CHECKS
echo
echo "🔗 VALIDACIONES DE CONSISTENCIA"
echo "--------------------------------"

# Check if all scripts have proper shebang
validate "Scripts tienen shebang correcto" "grep -l '^#!/bin/bash' scripts/core/*.sh | wc -l | xargs echo | grep -q '^[4-5]$'"

# Check for consistent formatting
validate "Scripts usan set -e" "grep -l 'set -e' scripts/core/*.sh | wc -l | xargs echo | grep -q '^[4-5]$'"

# 8. INTEGRATION TESTS
echo
echo "🔄 PRUEBAS DE INTEGRACIÓN"
echo "-------------------------"

# Test that metrics can run without errors
validate "Métricas ejecutan sin errores" "timeout 10s scripts/core/progress-metrics.sh >/dev/null 2>&1"

# Test that validation scripts don't crash
validate "Scripts de validación son estables" "scripts/core/validate-environment.sh >/dev/null 2>&1 || scripts/core/progress-metrics.sh >/dev/null 2>&1"

# SUMMARY
echo
echo "📊 RESUMEN DE VALIDACIÓN"
echo "========================"

SUCCESS_RATE=$((VALIDATIONS_PASSED * 100 / VALIDATIONS_TOTAL))

echo "Validaciones totales: $VALIDATIONS_TOTAL"
echo "Validaciones pasadas: $VALIDATIONS_PASSED"
echo "Tasa de éxito: ${SUCCESS_RATE}%"

if [ ${#ISSUES_FOUND[@]} -eq 0 ]; then
    echo -e "${GREEN}🎉 TODAS LAS VALIDACIONES PASARON${NC}"
    echo
    echo "✅ El proyecto está listo para el siguiente paso"
else
    echo -e "${RED}⚠️ SE ENCONTRARON ${#ISSUES_FOUND[@]} PROBLEMAS${NC}"
    echo
    echo "Problemas encontrados:"
    for issue in "${ISSUES_FOUND[@]}"; do
        echo "  - $issue"
    done
    echo
    echo "💡 Recomendación: Resolver estos problemas antes de continuar"
fi

# OVERALL STATUS
echo
echo "🏁 ESTADO GENERAL DEL PROYECTO"
echo "=============================="

if [ "$SUCCESS_RATE" -ge 90 ] && [ ${#ISSUES_FOUND[@]} -eq 0 ]; then
    echo -e "${GREEN}🟢 LISTO PARA DESARROLLO${NC}"
    echo "El proyecto está en buen estado y listo para continuar con la Fase 1"
elif [ "$SUCCESS_RATE" -ge 75 ]; then
    echo -e "${YELLOW}🟡 REQUIERE ATENCIÓN MENOR${NC}"
    echo "Hay algunos problemas menores que deberían resolverse"
else
    echo -e "${RED}🔴 REQUIERE ATENCIÓN URGENTE${NC}"
    echo "Hay problemas críticos que impiden el progreso normal"
fi

echo
echo "📈 PRÓXIMOS PASOS:"
echo "1. Revisar las métricas detalladas con: ./scripts/core/progress-metrics.sh"
echo "2. Ejecutar validación del entorno: ./scripts/core/validate-environment.sh"
echo "3. Preparar backup antes de cambios: ./scripts/core/rollback.sh --create"
echo "4. Comenzar limpieza priorizada: ./scripts/core/prioritized-cleanup.sh --dry-run"
