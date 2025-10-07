#!/bin/bash
# ROLLBACK: Revert changes if something goes wrong
# Version: 1.0.0

set -e

echo "⏪ SISTEMA DE ROLLBACK"
echo "===================="

# Function to create backup
create_backup() {
    local backup_name="$1"
    local source_path="$2"
    
    if [ -e "$source_path" ]; then
        local backup_path="rollback_backups/${backup_name}_$(date +%Y%m%d_%H%M%S)"
        mkdir -p rollback_backups
        
        if [ -d "$source_path" ]; then
            cp -r "$source_path" "$backup_path"
        else
            cp "$source_path" "$backup_path"
        fi
        
        echo "   📦 Backup creado: $backup_path"
        echo "rollback_backups/${backup_name}_$(date +%Y%m%d_%H%M%S)" >> .rollback_manifest
    fi
}

# Function to restore from backup
restore_backup() {
    local backup_name="$1"
    local target_path="$2"
    
    local latest_backup=$(ls -t rollback_backups/${backup_name}_* 2>/dev/null | head -1)
    
    if [ -n "$latest_backup" ] && [ -e "$latest_backup" ]; then
        echo "   🔄 Restaurando: $backup_name"
        if [ -d "$latest_backup" ]; then
            rm -rf "$target_path"
            cp -r "$latest_backup" "$target_path"
        else
            cp "$latest_backup" "$target_path"
        fi
        echo "   ✅ Restaurado: $target_path"
    else
        echo "   ⚠️ No se encontró backup para: $backup_name"
    fi
}

# Main rollback function
rollback() {
    echo "🚨 INICIANDO ROLLBACK COMPLETO"
    echo "=============================="
    
    if [ ! -f ".rollback_manifest" ]; then
        echo "❌ No se encontró manifest de rollback"
        exit 1
    fi
    
    echo "Manifest encontrado. Restaurando..."
    
    # Reset git changes
    if git diff --quiet && git diff --staged --quiet; then
        echo "   ℹ️ No hay cambios git para revertir"
    else
        echo "   🔄 Revirtiendo cambios git..."
        git reset --hard HEAD
        git clean -fd
        echo "   ✅ Cambios git revertidos"
    fi
    
    # Restore from backups
    while IFS= read -r backup_path; do
        if [ -e "$backup_path" ]; then
            # Extract original path from backup name
            local original_name=$(basename "$backup_path" | sed 's/_[0-9]\{8\}_[0-9]\{6\}$//')
            local target_path=""
            
            case "$original_name" in
                "scripts_dir")
                    target_path="scripts"
                    ;;
                "lib_dir")
                    target_path="lib"
                    ;;
                "docs_dir")
                    target_path="docs"
                    ;;
                "root_file_"*)
                    target_path="${original_name#root_file_}"
                    ;;
                *)
                    echo "   ⚠️ No se reconoce: $original_name"
                    continue
                    ;;
            esac
            
            if [ -n "$target_path" ]; then
                restore_backup "$original_name" "$target_path"
            fi
        fi
    done < .rollback_manifest
    
    # Clean up
    rm -rf rollback_backups
    rm -f .rollback_manifest
    
    echo
    echo "🎉 ROLLBACK COMPLETADO"
    echo "======================"
    echo "Estado del repositorio:"
    echo "  Scripts: $(find scripts/ -name "*.sh" 2>/dev/null | wc -l || echo "N/A")"
    echo "  Tamaño: $(du -sh . 2>/dev/null | cut -f1 || echo "N/A")"
}

# Create backup before changes
backup_before_changes() {
    echo "📦 CREANDO BACKUPS ANTES DE CAMBIOS"
    echo "==================================="
    
    mkdir -p rollback_backups
    
    # Backup critical directories
    create_backup "scripts_dir" "scripts/"
    create_backup "lib_dir" "lib/"
    create_backup "docs_dir" "docs/"
    
    # Backup critical root files
    for file in package.json pnpm-workspace.yaml docker-compose.dev.yml; do
        if [ -f "$file" ]; then
            create_backup "root_file_$file" "$file"
        fi
    done
    
    echo "✅ Backups creados en: rollback_backups/"
    echo "   Manifest: .rollback_manifest"
}

# Show help
show_help() {
    echo "Uso: $0 [backup|rollback]"
    echo
    echo "Comandos:"
    echo "  backup   - Crear backups antes de cambios"
    echo "  rollback - Restaurar desde backups"
    echo
    echo "Ejemplos:"
    echo "  $0 backup   # Antes de hacer cambios"
    echo "  $0 rollback # Si algo sale mal"
}

# Main logic
case "${1:-}" in
    "backup")
        backup_before_changes
        ;;
    "rollback")
        rollback
        ;;
    *)
        show_help
        exit 1
        ;;
esac
