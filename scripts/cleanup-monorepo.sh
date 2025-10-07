#!/bin/bash
# Script de limpieza RADICAL del monorepo ECONEURA
# Elimina archivos obsoletos, duplicados y no funcionales

set -e

echo "🧹 LIMPIEZA RADICAL DEL MONOREPO ECONEURA"
echo "=========================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

DELETED_COUNT=0

delete_file() {
  if [ -f "$1" ]; then
    echo -e "${RED}🗑️  Eliminando: $1${NC}"
    rm "$1"
    ((DELETED_COUNT++))
  fi
}

delete_dir() {
  if [ -d "$1" ]; then
    echo -e "${RED}🗑️  Eliminando directorio: $1${NC}"
    rm -rf "$1"
    ((DELETED_COUNT++))
  fi
}

echo "1️⃣  Eliminando workflows .OLD..."
delete_file ".github/workflows/ci-smoke.yml.OLD"
delete_file ".github/workflows/ci.yml.OLD"
delete_file ".github/workflows/deploy-api.yml.OLD"
delete_file ".github/workflows/deploy-web.yml.OLD"

echo ""
echo "2️⃣  Eliminando archivos de documentación obsoletos/duplicados..."
delete_file "ACTION_PLAN_WORKFLOWS.md"
delete_file "ci-RADICAL-SOFT-MODE.md"
delete_file "CICD_FIX_SUMMARY.md"
delete_file "VERIFICATION_QUICK.md"
delete_file "WF_EVIDENCE.csv"
delete_file "final_setup.sh"

echo ""
echo "3️⃣  Eliminando backups y rollbacks..."
delete_dir "rollback_backups"
delete_file ".rollback_manifest"

echo ""
echo "4️⃣  Eliminando archivos temporales y cache..."
delete_dir "node-v20.10.0-linux-x64"
delete_file "node.tar.xz"
delete_file "package-lock.json"  # Usamos pnpm-lock.yaml

echo ""
echo "5️⃣  Eliminando directorios vacíos o no utilizados..."
# Verificar si lib/ tiene contenido útil
if [ -d "lib" ]; then
  FILE_COUNT=$(find lib -type f | wc -l)
  if [ "$FILE_COUNT" -lt 3 ]; then
    echo -e "${YELLOW}⚠️  lib/ tiene pocos archivos, considerando eliminación...${NC}"
    delete_dir "lib"
  fi
fi

echo ""
echo "6️⃣  Limpiando node_modules y reinstalando..."
if [ -d "node_modules" ]; then
  echo -e "${YELLOW}🔄 Limpiando node_modules...${NC}"
  rm -rf node_modules
  rm -rf apps/*/node_modules
  rm -rf packages/*/node_modules
fi

echo ""
echo "7️⃣  Limpiando archivos de configuración obsoletos..."
# Verificar si hay configs duplicados
delete_file ".npmrc"  # Usamos pnpm
delete_file ".coverage.ignore"  # Vitest maneja esto
delete_file ".cpdignore"  # Si no usamos jscpd
delete_file ".jscpd.json"  # Si no usamos jscpd

echo ""
echo "8️⃣  Consolidando documentación en docs/..."
# Mover archivos relevantes a docs/ si no están ahí
if [ -f "README.dev.md" ] && [ ! -f "docs/README.dev.md" ]; then
  echo "📝 Moviendo README.dev.md a docs/"
  mv README.dev.md docs/
fi

echo ""
echo -e "${GREEN}✅ LIMPIEZA COMPLETADA${NC}"
echo ""
echo "📊 Resumen:"
echo "  - Archivos/directorios eliminados: $DELETED_COUNT"
echo ""
echo "🔄 Próximos pasos recomendados:"
echo "  1. pnpm install --frozen-lockfile"
echo "  2. pnpm -w run typecheck"
echo "  3. pnpm -w run lint"
echo "  4. git add -A && git commit -m 'chore: Limpieza radical del monorepo'"
echo ""
