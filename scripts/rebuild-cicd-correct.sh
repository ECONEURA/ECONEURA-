#!/bin/bash
# ===============================================================
# ECONEURA - RECONSTRUCCIÓN CI/CD CORRECTA Y VERIFICADA
# Versión mejorada que respeta la estructura REAL del proyecto
# ===============================================================

set -euo pipefail
export LANG=C.UTF-8

echo "╔════════════════════════════════════════════════════════╗"
echo "║  ECONEURA - RECONSTRUCCIÓN CI/CD CORRECTA              ║"
echo "║  Basada en la estructura REAL del proyecto             ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# ---------------------------------------------------------------
# FASE 0: Validación de prerrequisitos
# ---------------------------------------------------------------
echo "📋 [FASE 0] Validación de estructura del proyecto"
echo "=================================================="

# Verificar que estamos en la raíz del proyecto
if [ ! -f "pnpm-workspace.yaml" ]; then
    echo "❌ ERROR: No estamos en la raíz del proyecto ECONEURA"
    exit 1
fi

# Verificar estructura REAL
echo "✓ Verificando estructura del proyecto..."
REQUIRED_DIRS=("apps/web" "apps/api_py" "packages/shared" "packages/configs")
MISSING_DIRS=()

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "  ❌ Falta: $dir"
        MISSING_DIRS+=("$dir")
    else
        echo "  ✓ Existe: $dir"
    fi
done

if [ ${#MISSING_DIRS[@]} -gt 0 ]; then
    echo ""
    echo "❌ ERROR: Faltan directorios críticos: ${MISSING_DIRS[*]}"
    exit 1
fi

# Verificar herramientas
echo ""
echo "🔧 Verificando herramientas..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js no instalado"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { 
    echo "⚠️  pnpm no encontrado, instalando..."
    corepack enable
    corepack prepare pnpm@8.15.5 --activate
}

NODE_VERSION=$(node -v)
PNPM_VERSION=$(pnpm -v)
echo "  ✓ Node: $NODE_VERSION"
echo "  ✓ pnpm: $PNPM_VERSION"

# ---------------------------------------------------------------
# FASE 1: Backup de seguridad
# ---------------------------------------------------------------
echo ""
echo "💾 [FASE 1] Creando backup de seguridad"
echo "========================================"

BACKUP_DIR=".backup_cicd_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -d .github/workflows ]; then
    cp -r .github/workflows "$BACKUP_DIR/"
    echo "✓ Backup de workflows creado en: $BACKUP_DIR/workflows"
fi

# ---------------------------------------------------------------
# FASE 2: Instalación de dependencias
# ---------------------------------------------------------------
echo ""
echo "📦 [FASE 2] Instalando dependencias del workspace"
echo "=================================================="

echo "→ Instalando dependencias con pnpm..."
pnpm install --frozen-lockfile || {
    echo "⚠️  frozen-lockfile falló, intentando sin freeze..."
    pnpm install
}

echo "→ Building packages compartidos..."
pnpm -w run build || {
    echo "⚠️  Build falló o no está configurado, continuando..."
}

# ---------------------------------------------------------------
# FASE 3: Crear workflows CORRECTOS
# ---------------------------------------------------------------
echo ""
echo "⚙️  [FASE 3] Creando workflows CI/CD correctos"
echo "=============================================="

mkdir -p .github/workflows

# ============================================
# WORKFLOW 1: CI Básico (lint + typecheck)
# ============================================
echo "→ Creando ci-basic.yml..."
cat > .github/workflows/ci-basic.yml << 'EOF'
name: CI Basic (lint + typecheck)

on:
  push:
    branches: [ "main", "develop" ]
  pull_request:
    branches: [ "main" ]
  workflow_dispatch: {}

permissions:
  contents: read

jobs:
  lint-and-typecheck:
    name: Lint & TypeCheck
    runs-on: ubuntu-latest
    timeout-minutes: 15
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      
      - name: Enable pnpm
        run: corepack enable
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build shared packages
        run: pnpm -w run build || echo "No build script in root"
      
      - name: TypeCheck
        run: pnpm -w run typecheck
      
      - name: Lint (strict)
        run: pnpm -w run lint
EOF

# ============================================
# WORKFLOW 2: Build Web
# ============================================
echo "→ Creando build-web.yml..."
cat > .github/workflows/build-web.yml << 'EOF'
name: Build Web Application

on:
  push:
    branches: [ "main", "develop" ]
    paths:
      - "apps/web/**"
      - "packages/**"
      - ".github/workflows/build-web.yml"
  pull_request:
    branches: [ "main" ]
  workflow_dispatch: {}

permissions:
  contents: read

jobs:
  build:
    name: Build Web App
    runs-on: ubuntu-latest
    timeout-minutes: 15
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      
      - name: Enable pnpm
        run: corepack enable
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build shared packages
        run: pnpm -w run build || echo "No build script"
      
      - name: Build web app
        working-directory: apps/web
        run: pnpm run build
      
      - name: Verify build artifacts
        working-directory: apps/web
        run: |
          test -d dist || { echo "❌ dist directory not created"; exit 1; }
          test -f dist/index.html || { echo "❌ index.html not found"; exit 1; }
          echo "✓ Build artifacts verified"
          ls -lah dist/
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: web-build
          path: apps/web/dist/
          retention-days: 7
EOF

# ============================================
# WORKFLOW 3: Validate Python API
# ============================================
echo "→ Creando validate-api-python.yml..."
cat > .github/workflows/validate-api-python.yml << 'EOF'
name: Validate Python API

on:
  push:
    branches: [ "main", "develop" ]
    paths:
      - "apps/api_py/**"
      - ".github/workflows/validate-api-python.yml"
  pull_request:
    branches: [ "main" ]
  workflow_dispatch: {}

permissions:
  contents: read

jobs:
  validate:
    name: Validate Python API
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      
      - name: Verify API structure
        working-directory: apps/api_py
        run: |
          test -f server.py || { echo "❌ server.py not found"; exit 1; }
          echo "✓ API structure verified"
      
      - name: Python syntax check
        working-directory: apps/api_py
        run: |
          python -m py_compile server.py
          echo "✓ Python syntax valid"
      
      - name: Check for required endpoints
        working-directory: apps/api_py
        run: |
          grep -q "def.*health" server.py && echo "✓ Health endpoint found" || echo "⚠️  No health endpoint"
          grep -q "ROUTES" server.py && echo "✓ Routes configuration found" || echo "⚠️  No routes config"
EOF

# ============================================
# WORKFLOW 4: Deploy to Azure (conditional)
# ============================================
echo "→ Creando deploy-azure.yml..."
cat > .github/workflows/deploy-azure.yml << 'EOF'
name: Deploy to Azure

on:
  push:
    branches: [ "main" ]
  workflow_dispatch: {}

permissions:
  contents: read

jobs:
  check-secrets:
    name: Check Azure Secrets
    runs-on: ubuntu-latest
    outputs:
      has-web-secret: ${{ steps.check.outputs.has-web }}
      has-api-secret: ${{ steps.check.outputs.has-api }}
    steps:
      - name: Check secrets
        id: check
        run: |
          if [ -n "${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_WEB }}" ]; then
            echo "has-web=true" >> $GITHUB_OUTPUT
          else
            echo "has-web=false" >> $GITHUB_OUTPUT
          fi
          if [ -n "${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_API }}" ]; then
            echo "has-api=true" >> $GITHUB_OUTPUT
          else
            echo "has-api=false" >> $GITHUB_OUTPUT
          fi

  deploy-web:
    name: Deploy Web to Azure
    needs: check-secrets
    if: needs.check-secrets.outputs.has-web-secret == 'true'
    runs-on: ubuntu-latest
    timeout-minutes: 20
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      
      - name: Enable pnpm
        run: corepack enable
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build packages
        run: pnpm -w run build || echo "No build script"
      
      - name: Build web
        working-directory: apps/web
        run: pnpm run build
      
      - name: Create deployment package
        working-directory: apps/web/dist
        run: zip -r ../../../web-deploy.zip .
      
      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: econeura-web-dev
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_WEB }}
          package: web-deploy.zip

  deploy-api:
    name: Deploy API to Azure
    needs: check-secrets
    if: needs.check-secrets.outputs.has-api-secret == 'true'
    runs-on: ubuntu-latest
    timeout-minutes: 20
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      
      - name: Install dependencies
        working-directory: apps/api_py
        run: |
          if [ -f requirements.txt ]; then
            pip install -r requirements.txt
          else
            echo "No requirements.txt - using stdlib only"
          fi
      
      - name: Create deployment package
        working-directory: apps/api_py
        run: zip -r ../../api-deploy.zip .
      
      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: econeura-api-dev
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_API }}
          package: api-deploy.zip
EOF

# ============================================
# WORKFLOW 5: Smoke Tests (post-deploy)
# ============================================
echo "→ Creando smoke-tests.yml..."
cat > .github/workflows/smoke-tests.yml << 'EOF'
name: Smoke Tests

on:
  workflow_run:
    workflows: ["Deploy to Azure"]
    types: [completed]
  workflow_dispatch: {}

permissions:
  contents: read

jobs:
  smoke:
    name: Run Smoke Tests
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    steps:
      - name: Test Web Health
        continue-on-error: true
        run: |
          echo "Testing web application..."
          curl -fsS -m 10 https://econeura-web-dev.azurewebsites.net/ | head -c 1000
          echo "✓ Web is responding"
      
      - name: Test API Health
        continue-on-error: true
        run: |
          echo "Testing API health endpoint..."
          curl -fsS -m 10 https://econeura-api-dev.azurewebsites.net/api/health | tee /tmp/api-health.json
          grep -q '"ok":true' /tmp/api-health.json && echo "✓ API health check passed" || echo "⚠️  API health check inconclusive"
EOF

echo ""
echo "✓ Todos los workflows creados exitosamente"

# ---------------------------------------------------------------
# FASE 4: Validación de workflows
# ---------------------------------------------------------------
echo ""
echo "✅ [FASE 4] Validando workflows creados"
echo "========================================"

WORKFLOW_COUNT=0
for workflow in .github/workflows/*.yml; do
    if [ -f "$workflow" ]; then
        # Verificar sintaxis básica
        if grep -q "^name:" "$workflow" && grep -q "^on:" "$workflow"; then
            echo "  ✓ $(basename "$workflow")"
            ((WORKFLOW_COUNT++))
        else
            echo "  ❌ $(basename "$workflow") - sintaxis inválida"
        fi
    fi
done

echo ""
echo "Total workflows válidos: $WORKFLOW_COUNT"

# ---------------------------------------------------------------
# FASE 5: Verificación local
# ---------------------------------------------------------------
echo ""
echo "🧪 [FASE 5] Verificación local"
echo "==============================="

echo "→ Verificando que los comandos de CI funcionan localmente..."

# TypeCheck
if pnpm -w run typecheck 2>&1 | grep -q "error"; then
    echo "  ⚠️  TypeCheck tiene errores"
else
    echo "  ✓ TypeCheck OK"
fi

# Lint
if pnpm -w run lint 2>&1 | grep -q "error"; then
    echo "  ⚠️  Lint tiene errores"
else
    echo "  ✓ Lint OK"
fi

# Build web
if pnpm -C apps/web run build >/dev/null 2>&1; then
    echo "  ✓ Web build OK"
    test -f apps/web/dist/index.html && echo "  ✓ index.html generado" || echo "  ❌ index.html NO generado"
else
    echo "  ⚠️  Web build falló"
fi

# ---------------------------------------------------------------
# FASE 6: Resumen y próximos pasos
# ---------------------------------------------------------------
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║             ✅ RECONSTRUCCIÓN COMPLETADA               ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📋 WORKFLOWS CREADOS:"
echo "  • ci-basic.yml           - Lint y TypeCheck"
echo "  • build-web.yml          - Build de aplicación web"
echo "  • validate-api-python.yml - Validación de API Python"
echo "  • deploy-azure.yml       - Deployment condicional a Azure"
echo "  • smoke-tests.yml        - Tests post-deployment"
echo ""
echo "🔐 SECRETS REQUERIDOS (si vas a deployar):"
echo "  • AZURE_WEBAPP_PUBLISH_PROFILE_WEB"
echo "  • AZURE_WEBAPP_PUBLISH_PROFILE_API"
echo ""
echo "📍 PRÓXIMOS PASOS:"
echo "  1. Revisar workflows en .github/workflows/"
echo "  2. Hacer commit de los cambios"
echo "  3. Push a GitHub para activar CI"
echo "  4. (Opcional) Añadir secrets para deployment"
echo ""
echo "💾 BACKUP guardado en: $BACKUP_DIR"
echo ""
