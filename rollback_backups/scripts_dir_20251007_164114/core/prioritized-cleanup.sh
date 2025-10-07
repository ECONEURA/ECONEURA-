#!/bin/bash
# PRIORITIZED CLEANUP: Remove non-essential files systematically
# Version: 1.0.0

set -e

echo "🧹 LIMPIEZA PRIORIZADA DEL REPOSITORIO"
echo "======================================"

# Function to count and remove
cleanup_category() {
    local category="$1"
    local pattern="$2"
    local description="$3"
    
    echo
    echo "📂 Categoría: $category"
    echo "   Descripción: $description"
    
    local files=$(find . -name "$pattern" -type f 2>/dev/null | wc -l)
    echo "   Archivos encontrados: $files"
    
    if [ "$files" -gt 0 ]; then
        echo "   Eliminando..."
        find . -name "$pattern" -type f -exec rm -f {} \; 2>/dev/null || true
        echo "   ✅ Eliminados: $files archivos"
    else
        echo "   ℹ️ No se encontraron archivos"
    fi
}

# PRIORIDAD 1: Archivos temporales y backups (Seguro eliminar)
echo "🚨 PRIORIDAD 1: Archivos temporales y backups"
cleanup_category "Backups" "*.bak" "Archivos de backup innecesarios"
cleanup_category "Temporales" "*.tmp" "Archivos temporales"
cleanup_category "Logs" "*.log" "Archivos de log antiguos"
cleanup_category "Zips" "*.zip" "Archivos comprimidos temporales"

# PRIORIDAD 2: Scripts innecesarios (Verificar antes)
echo
echo "⚠️ PRIORIDAD 2: Scripts potencialmente innecesarios"
echo "   Verificando scripts en /scripts..."

# Contar scripts por categorías
TOTAL_SCRIPTS=$(find scripts/ -name "*.sh" -type f | wc -l)
echo "   Total scripts: $TOTAL_SCRIPTS"

# Scripts que contienen palabras clave de temporalidad
TEMP_SCRIPTS=$(find scripts/ -name "*.sh" -type f -exec grep -l -E "(check|validate|test|verify|smoke|safe|fix|setup|apply|clean|mock|dummy|example)" {} \; | wc -l)
echo "   Scripts temporales: $TEMP_SCRIPTS"

# Scripts que NO contienen palabras críticas
SAFE_SCRIPTS=$(find scripts/ -name "*.sh" -type f | grep -v -E "(build|deploy|ci|cd|install|start|stop)" | wc -l)
echo "   Scripts potencialmente seguros para eliminar: $SAFE_SCRIPTS"

echo
echo "💡 RECOMENDACIÓN: Revisar manualmente los $TEMP_SCRIPTS scripts temporales"
echo "   Comandos sugeridos:"
echo "   find scripts/ -name \"*.sh\" | xargs grep -l \"check\\|validate\\|test\" | head -10"

# PRIORIDAD 3: Directorios innecesarios
echo
echo "📁 PRIORIDAD 3: Directorios innecesarios"
if [ -d "venv" ]; then
    echo "   Eliminando venv/ ($(du -sh venv | cut -f1))"
    rm -rf venv
    echo "   ✅ Eliminado: venv/"
fi

if [ -d ".tools" ]; then
    echo "   Eliminando .tools/ ($(du -sh .tools | cut -f1))"
    rm -rf .tools
    echo "   ✅ Eliminado: .tools/"
fi

# PRIORIDAD 4: Archivos root innecesarios
echo
echo "🏠 PRIORIDAD 4: Archivos root innecesarios"
ROOT_FILES=(
    "fix_ci.sh"
    "setup-cockpit.sh"
    ".cockpit_fast.sh"
    "add_continue_on_error.sh"
    "add_mock.js"
)

for file in "${ROOT_FILES[@]}"; do
    if [ -f "$file" ]; then
        rm -f "$file"
        echo "   ✅ Eliminado: $file"
    fi
done

# RESULTADOS FINALES
echo
echo "📊 RESULTADOS DE LIMPIEZA PRIORIZADA"
echo "===================================="

echo "Estado actual:"
echo "  Tamaño repo: $(du -sh . | cut -f1)"
echo "  Scripts restantes: $(find scripts/ -name "*.sh" | wc -l)"
echo "  Archivos totales: $(find . -type f | wc -l)"

echo
echo "🎯 PRÓXIMOS PASOS RECOMENDADOS:"
echo "1. Revisar manualmente scripts temporales restantes"
echo "2. Verificar que el proyecto aún compile"
echo "3. Hacer commit de cambios seguros"
echo "4. Continuar con eliminación agresiva si es necesario"
