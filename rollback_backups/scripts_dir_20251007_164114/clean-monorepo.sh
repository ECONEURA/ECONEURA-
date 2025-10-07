#!/bin/bash
set -euo pipefail

echo "🧹 INICIANDO LIMPIEZA EXHAUSTIVA DEL MONOREPO ECONEURA"
echo "======================================================"

# Función para loggear operaciones
log_operation() {
    echo "✅ $1"
}

# Función para loggear eliminaciones
log_deletion() {
    echo "🗑️  Eliminando: $1"
}

echo
echo "1. ELIMINANDO ARCHIVOS DE BACKUP Y TEMPORALES..."
echo "------------------------------------------------"

# Archivos de backup
backup_files=(
    "package.json.bak"
    "package.json.backup"
    ".gitignore.backup"
    ".eslintignore.bak"
    "apps/web/src/components/CockpitPreview.tsx.bak.*"
)

for file in "${backup_files[@]}"; do
    if [ -f "$file" ]; then
        rm -f "$file"
        log_deletion "$file"
    fi
done

# Logs temporales
temp_logs=(
    ".local_server.log"
    "pnpm-install.log"
    "tsc.log"
    "vitest.log"
    "eslint.log"
)

for log in "${temp_logs[@]}"; do
    if [ -f "$log" ]; then
        rm -f "$log"
        log_deletion "$log"
    fi
done

echo
echo "2. ELIMINANDO DIRECTORIOS TEMPORALES..."
echo "---------------------------------------"

# Directorios temporales
temp_dirs=(
    ".ci_activation_*"
    "patches_*"
    ".automation_logs"
    ".cache"
    ".artifacts"
    "artifacts_download"
    "runlogs"
    "temp_*"
    "tmp_*"
    ".ai_*"
    ".econeura_backup"
    ".econeura_run"
    "ECONEURA"
    "coverage"
    "reports"
    "audit"
    "monitoring"
    "preview"
    "scenarios"
    "dev"
    "docs"
    "config"
    "types"
    "mega-prompts"
)

for dir in "${temp_dirs[@]}"; do
    if [ -d "$dir" ]; then
        rm -rf "$dir"
        log_deletion "directorio $dir/"
    fi
done

echo
echo "3. CONSOLIDANDO CONFIGURACIONES DUPLICADAS..."
echo "---------------------------------------------"

# Eliminar configuraciones duplicadas de vitest
vitest_configs=(
    "vitest.f2.config.ts"
    "vitest.integration.config.ts"
    "vitest.performance.config.ts"
    "vitest.workspace.json"
    "tsconfig.cockpit.dev.json"
)

for config in "${vitest_configs[@]}"; do
    if [ -f "$config" ]; then
        rm -f "$config"
        log_deletion "$config (duplicado)"
    fi
done

# Mantener solo eslint.config.js, eliminar .mjs
if [ -f "eslint.config.mjs" ]; then
    rm -f "eslint.config.mjs"
    log_deletion "eslint.config.mjs (duplicado)"
fi

echo
echo "4. CONSOLIDANDO DIRECTORIOS DE TEST..."
echo "--------------------------------------"

# Consolidar test/ y tests/ en tests/
if [ -d "test" ] && [ -d "tests" ]; then
    # Mover contenido de test/ a tests/
    if [ -f "test/setup.ts" ]; then
        mv "test/setup.ts" "tests/setup.ts" 2>/dev/null || true
        log_operation "Moviendo test/setup.ts → tests/setup.ts"
    fi
    if [ -d "test/shims" ]; then
        mv "test/shims" "tests/shims" 2>/dev/null || true
        log_operation "Moviendo test/shims/ → tests/shims/"
    fi
    rmdir "test" 2>/dev/null || true
    log_deletion "directorio test/ (consolidado en tests/)"
fi

echo
echo "5. CONSOLIDANDO SCRIPTS..."
echo "---------------------------"

# Eliminar scripts PowerShell excesivos (mantener solo esenciales)
powershell_scripts=$(find . -name "*.ps1" | grep -v "STATUS_COV_DIFF_FAST.ps1\|COVERAGE_SNAPSHOT_NANO.ps1" | head -60)
for script in $powershell_scripts; do
    if [[ "$script" != *"STATUS"* ]] && [[ "$script" != *"COVERAGE"* ]]; then
        rm -f "$script"
        log_deletion "$script (script PS1 excesivo)"
    fi
done

# Consolidar scripts de setup
setup_scripts=(
    "scripts/setup_dev_env.sh"
    "scripts/setup-dev.sh"
    "setup_cockpit.sh"
    "setup_cockpit_final.sh"
    "setup_cockpit.sh"
    "setup_final_pixel.sh"
    "setup_live_preview.sh"
    "setup_mount_cockpit.sh"
    "setup_mvp.sh"
    "setup_plan_c.sh"
    "setup_rootless.sh"
)

for script in "${setup_scripts[@]}"; do
    if [ -f "$script" ] && [[ "$script" != "scripts/setup-dev.sh" ]]; then
        rm -f "$script"
        log_deletion "$script (duplicado de setup)"
    fi
done

echo
echo "6. CONSOLIDANDO READMEs..."
echo "--------------------------"

# Mantener solo README.md principal y README.dev.md
readme_files=(
    "README_OPERATIONS.md"
    "AI-TERMINAL-PRO-README.md"
    "AI-TERMINAL-README.md"
    "SIMPLE-BROWSER-README.md"
    "LIVE-PREVIEW-README.md"
    "AZURE_PROVISION_README.md"
    "AZURE-DEPLOYMENT.md"
    "REVISION-EXHAUSTIVA-README.md"
)

for readme in "${readme_files[@]}"; do
    if [ -f "$readme" ]; then
        rm -f "$readme"
        log_deletion "$readme (consolidado en README.md)"
    fi
done

echo
echo "7. ELIMINANDO ARCHIVOS DE DESARROLLO TEMPORALES..."
echo "--------------------------------------------------"

# Archivos temporales varios
temp_files=(
    "DONE_FLAG"
    "REVIEW_OK"
    "REVIEW_OK_REQUIRED"
    "PR_READY.md"
    "FIX_PLAN.md"
    "PHASES_PROGRESS.md"
    "SCORECARD.md"
    "WORK_BRANCHES.md"
    "LOCAL_CHANGES.md"
    "phases-progress.json"
    "artifact_urls.txt"
    "changed_files.txt"
    "build_test.log.zip"
    "analysis_report.txt"
    "evidence_script.js"
    "summary.js"
    "summary_script.js"
    "temp_evidence.js"
    "temp_pkg.js"
    "temp_summary.js"
    "generate-v11-report.js"
    "bulk-eslint-fix.js"
    "fix-any-types.js"
    "fix-remaining-eslint.js"
    "fix-request-params.js"
    "fix-unused-vars.js"
    "purge_secrets.js"
    "scanner.js"
    "validate_proxy.ps1"
    "validate_proxy_new.ps1"
    "test_proxy_e2e.ps1"
    "simple_proxy_test.ps1"
    "debug_proxy.ps1"
    "test_server.py"
    "test_advanced.sh"
    "test_econeura.sh"
    "test_pr_visibility.txt"
    "add_continue_on_error.sh"
    "add_mock.js"
    "exa-boost.js"
    "f0_hotfix.js"
    "f1_fast_patch.js"
    "f1_patch.js"
    "f2_metrics.js"
    "tmp-f7-proxy.js"
    "nodeploy_script.js"
    "optimize_ci.sh"
    "monitor_ci.sh"
    "monitor_production.sh"
    "alerts_azure.sh"
    "auto_scale_azure.sh"
    "dashboard_azure.sh"
    "deploy_azure.sh"
    "push_secure.sh"
    "k8s_deploy.sh"
    "live-preview-setup.sh"
    "live-server-setup.sh"
    "cockpit-simple-browser.sh"
    "econeura-cockpit-e2e.sh"
    "setup_cockpit_final.sh"
    "setup_cockpit.sh"
)

for file in "${temp_files[@]}"; do
    if [ -f "$file" ]; then
        rm -f "$file"
        log_deletion "$file (temporal de desarrollo)"
    fi
done

echo
echo "8. CONSOLIDANDO DOCUMENTACIÓN..."
echo "--------------------------------"

# Mantener solo documentación esencial
docs_to_remove=(
    "CONTRIBUTING.md"
    "SECURITY.md"
    "SECURITY_AUDIT_README.md"
    "DETALLE_ECONEURA.md"
    "FODA.md"
    "GAP_F7.md"
    "INSTRUCCIONES-FINALES-RADICAL.md"
    "MANUAL-ELIMINACION-ROJA.md"
    "MEJORAS-CRITICAS-IMPLEMENTADAS.md"
    "MISION-COMPLETADA-CERO-CRUCES-ROJAS.md"
    "ELIMINACION-RADICAL-COMPLETADA.md"
    "SOLUCION-GITHUB-ACTIONS-ERROR.md"
    "CI-RADICAL-SOFT-MODE.md"
)

for doc in "${docs_to_remove[@]}"; do
    if [ -f "$doc" ]; then
        rm -f "$doc"
        log_deletion "$doc (documentación temporal)"
    fi
done

echo
echo "9. LIMPIEZA FINAL Y OPTIMIZACIÓN..."
echo "------------------------------------"

# Limpiar archivos de VSCode temporales
vscode_temp=(
    ".vscode/tasks_run_repair.sh"
)

for file in "${vscode_temp[@]}"; do
    if [ -f "$file" ]; then
        rm -f "$file"
        log_deletion "$file (temporal VSCode)"
    fi
done

# Limpiar archivos de linting temporales
lint_temp=(
    ".lintstagedrc.json"
)

for file in "${lint_temp[@]}"; do
    if [ -f "$file" ]; then
        rm -f "$file"
        log_deletion "$file (config temporal)"
    fi
done

echo
echo "10. VERIFICACIÓN FINAL..."
echo "-------------------------"

# Verificar que archivos críticos siguen existiendo
critical_files=(
    "package.json"
    ".gitignore"
    "README.md"
    "README.dev.md"
    "apps/web/package.json"
    "apps/api_py/server.py"
    "packages/shared/package.json"
    "pnpm-workspace.yaml"
    ".github/workflows/ci-smoke.yml"
    ".github/workflows/ci-full.yml"
    ".github/workflows/deploy-web.yml"
    ".github/workflows/deploy-api.yml"
    ".github/workflows/post-deploy-health.yml"
)

echo "Verificando archivos críticos..."
for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ FALTA: $file"
    fi
done

echo
echo "11. ESTADÍSTICAS FINALES..."
echo "----------------------------"

echo "Archivos restantes en directorio raíz:"
find . -maxdepth 1 -type f | wc -l

echo "Directorios restantes en directorio raíz:"
find . -maxdepth 1 -type d | grep -v "^\.$" | wc -l

echo "Scripts bash restantes:"
find scripts/ -name "*.sh" 2>/dev/null | wc -l

echo "Scripts PowerShell restantes:"
find . -name "*.ps1" | wc -l

echo
log_operation "LIMPIEZA COMPLETADA EXITOSAMENTE"
echo "🎉 El monorepo ECONEURA ahora está limpio, ordenado y eficiente"
echo "📊 Se eliminaron archivos temporales, duplicados y configuraciones innecesarias"
echo "🚀 Manteniendo solo lo esencial para desarrollo y producción"