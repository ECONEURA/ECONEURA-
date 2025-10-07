# Scripts Directory - ECONEURA Monorepo

**Última actualización:** 2025-01-07  
**Estado:** Post-cleanup FASE 2 (consolidación completada)

Este directorio contiene scripts de automatización para desarrollo, testing, deployment y mantenimiento del monorepo ECONEURA.

---

## 📋 Índice de Scripts

### 🚀 Desarrollo y Arranque

| Script | Propósito | Uso |
|--------|-----------|-----|
| `start-dev.sh` | **Iniciar servicios dev** (Cockpit + API proxy + health checks) | `./scripts/start-dev.sh` |
| `express-dev-start.sh` | Arranque rápido en modo Express | `./scripts/express-dev-start.sh` |
| `express-status.sh` | Estado de servicios Express Mode | `./scripts/express-status.sh` |
| `express-velocity.sh` | Verificar velocidad de arranque | `./scripts/express-velocity.sh` |
| `express-aliases.sh` | Cargar aliases de Express Mode | `source scripts/express-aliases.sh` |

**Modo Express:** Sistema de desarrollo rápido con arranque optimizado y aliases. Ver `docs/EXPRESS-VELOCITY.md` para detalles.

---

### 🧹 Limpieza y Mantenimiento

| Script | Propósito | Uso |
|--------|-----------|-----|
| `clean.sh` | **Limpieza rápida** (dist, .next, .cache, coverage, tsbuildinfo) | `./scripts/clean.sh` |
| `clean-cache.sh` | Limpieza específica de cachés | `./scripts/clean-cache.sh` |
| `core/prioritized-cleanup.sh` | **Limpieza priorizada** (dry-run y completa) | `./scripts/core/prioritized-cleanup.sh [--dry-run]` |

**Nota:** Limpieza NO destructiva. No elimina `node_modules/`. Para reinstalar dependencias: `pnpm install --force`.

---

### ✅ Validación y Verificación

| Script | Propósito | Uso |
|--------|-----------|-----|
| `check_env.sh` | **Verificación rápida** (Node, pnpm disponibles) | `./scripts/check_env.sh` |
| `verify-repo.sh` | **Verificación completa** del estado del repo | `./scripts/verify-repo.sh` |
| `core/validate-environment.sh` | Validación de entorno dev completo | `./scripts/core/validate-environment.sh` |
| `core/validate-project.sh` | Validación de estructura de proyecto | `./scripts/core/validate-project.sh` |
| `validate-architecture.sh` | Validar arquitectura del monorepo | `./scripts/validate-architecture.sh` |
| `validate-types.sh` | Validación de tipos TypeScript | `./scripts/validate-types.sh` |
| `validate-cicd.sh` | Validación de configuración CI/CD | `./scripts/validate-cicd.sh` |
| `validate_with_cache.sh` | Validación con caché (optimizado) | `./scripts/validate_with_cache.sh` |
| `validate_gitleaks.sh` | **Secret scanning** con gitleaks | `./scripts/validate_gitleaks.sh` |

**Recomendación:** Usar `check_env.sh` para checks rápidos pre-commit. Usar `verify-repo.sh` para validación completa pre-PR.

---

### 🔧 Build y TypeScript

| Script | Propósito | Uso |
|--------|-----------|-----|
| `run-tsc.js` | **TypeScript checker** (usado por `pnpm typecheck`) | `node scripts/run-tsc.js` |
| `vitest-atomic-reporter.cjs` | Reporter custom Vitest para CI/CD | Auto-invocado por Vitest |

**Nota:** `run-tsc.js` es invocado por `pnpm -w typecheck`. No ejecutar directamente a menos que debugging.

---

### 🧪 Testing y CI/CD

| Script | Propósito | Uso |
|--------|-----------|-----|
| `comprehensive-test-suite.sh` | Suite completa de tests | `./scripts/comprehensive-test-suite.sh` |
| `smoke.sh` | **Smoke tests** (verificación rápida post-deploy) | `./scripts/smoke.sh` |
| `visual.sh` | Tests visuales | `./scripts/visual.sh` |
| `run-k6-tests.sh` | **Performance testing** con k6 | `./scripts/run-k6-tests.sh` |
| `infra-test.sh` | Testing de infraestructura | `./scripts/infra-test.sh` |

**k6 Testing:** Requiere k6 instalado (`brew install k6` o `choco install k6`). Ver `tests/performance/` para escenarios.

---

### 🔐 Seguridad y Auditoría

| Script | Propósito | Uso |
|--------|-----------|-----|
| `safety-checks.sh` | **Checks de seguridad** generales | `./scripts/safety-checks.sh` |
| `safe-mitigate.sh` | Mitigación de vulnerabilidades | `./scripts/safe-mitigate.sh` |
| `verify-mitigation.sh` | Verificar mitigaciones aplicadas | `./scripts/verify-mitigation.sh` |
| `integrity-check.sh` | Verificación de integridad del repo | `./scripts/integrity-check.sh` |

**Workflow:** `safety-checks.sh` → `safe-mitigate.sh` → `verify-mitigation.sh`

---

### 📦 DevContainer y Rebuild

| Script | Propósito | Uso |
|--------|-----------|-----|
| `core/rebuild-devcontainer.sh` | **Rebuild completo** de devcontainer | `./scripts/core/rebuild-devcontainer.sh` |
| `rebuild-dev-quick.sh` | **Rebuild rápido** (sin full rebuild) | `./scripts/rebuild-dev-quick.sh` |
| `monitor-rebuild.sh` | Monitorear proceso de rebuild | `./scripts/monitor-rebuild.sh` |
| `verify-rebuild.sh` | Verificar rebuild exitoso | `./scripts/verify-rebuild.sh` |
| `core/rollback.sh` | **Rollback** en caso de fallo | `./scripts/core/rollback.sh` |

**Recomendación:** Usar `rebuild-dev-quick.sh` para desarrollo. Usar `core/rebuild-devcontainer.sh` para reconstrucción completa.

---

### 🛠️ Utilidades Generales

| Script | Propósito | Uso |
|--------|-----------|-----|
| `quick-check.sh` | **Validación rápida** pre-commit | `./scripts/quick-check.sh` |
| `check-system-status.sh` | Estado del sistema dev | `./scripts/check-system-status.sh` |
| `check-dependencies.sh` | Verificar dependencias del sistema | `./scripts/check-dependencies.sh` |
| `generate-manifests.sh` | Generar manifests de deployment | `./scripts/generate-manifests.sh` |
| `apply-config.sh` | Aplicar configuración | `./scripts/apply-config.sh` |
| `automatic-documentation.sh` | **Generación automática de docs** | `./scripts/automatic-documentation.sh` |
| `sync-codespaces.sh` | Sincronizar con GitHub Codespaces | `./scripts/sync-codespaces.sh` |
| `core/progress-metrics.sh` | Métricas de progreso del proyecto | `./scripts/core/progress-metrics.sh` |

---

### 💻 PowerShell Scripts (Windows)

| Script | Propósito | Uso |
|--------|-----------|-----|
| `powershell/ONE_SHOT_100_v13.ps1` | **Script consolidado de validación** (última versión) | `pwsh scripts/powershell/ONE_SHOT_100_v13.ps1` |
| `powershell/ONE_SHOT_COVERAGE.ps1` | Reporte de coverage específico | `pwsh scripts/powershell/ONE_SHOT_COVERAGE.ps1` |
| `powershell/COVERAGE_SNAPSHOT_NANO.ps1` | Snapshot nano de coverage | `pwsh scripts/powershell/COVERAGE_SNAPSHOT_NANO.ps1` |
| `powershell/STATUS_90D_MINI.ps1` | Status minimalista 90 días | `pwsh scripts/powershell/STATUS_90D_MINI.ps1` |
| `powershell/STATUS_COV_DIFF_FAST.ps1` | Diff rápido de coverage | `pwsh scripts/powershell/STATUS_COV_DIFF_FAST.ps1` |

**Nota:** Scripts PowerShell diseñados para entornos Windows. Ver `scripts/powershell/README.md` para detalles.

---

## 🔄 Scripts Deprecados (Eliminados en FASE 2)

Los siguientes scripts fueron eliminados por redundancia y están disponibles en git history si necesario:

- ❌ `clean-monorepo.sh` (377 líneas) → Usar `core/prioritized-cleanup.sh`
- ❌ `cleanup-monorepo.sh` (109 líneas) → Usar `core/prioritized-cleanup.sh`
- ❌ `validate-repo.sh` (132 líneas) → Usar `verify-repo.sh` o `core/validate-environment.sh`
- ❌ `validate_env.sh` (27 líneas) → Usar `check_env.sh`
- ❌ `auto-rebuild-devcontainer.sh` → Usar `core/rebuild-devcontainer.sh`
- ❌ `rebuild-container-v2.sh` → Usar `core/rebuild-devcontainer.sh`
- ❌ `powershell/ONE_SHOT_100_v8.ps1` → Usar `v13.ps1`
- ❌ `powershell/ONE_SHOT_100_v10.ps1` → Usar `v13.ps1`
- ❌ `powershell/ONE_SHOT_100_v12.ps1` → Usar `v13.ps1`

**Total eliminado:** 9 archivos, ~1500 líneas de código redundante.

---

## 📚 Workflows Recomendados

### 1. **Setup inicial de desarrollo**
```bash
# Verificar entorno
./scripts/check_env.sh

# Instalar dependencias
pnpm install

# Validar todo
./scripts/verify-repo.sh

# Arrancar servicios
./scripts/start-dev.sh
```

### 2. **Pre-commit workflow**
```bash
# Limpieza rápida
./scripts/clean.sh

# Check rápido
./scripts/quick-check.sh

# O validación completa
pnpm -w lint && pnpm -w typecheck && pnpm -w test
```

### 3. **Pre-PR workflow**
```bash
# Verificación completa del repo
./scripts/verify-repo.sh

# Suite completa de tests
./scripts/comprehensive-test-suite.sh

# Smoke tests
./scripts/smoke.sh

# Validar arquitectura
./scripts/validate-architecture.sh
```

### 4. **Security audit workflow**
```bash
# Checks de seguridad
./scripts/safety-checks.sh

# Secret scanning
./scripts/validate_gitleaks.sh

# Mitigar vulnerabilidades
./scripts/safe-mitigate.sh

# Verificar mitigaciones
./scripts/verify-mitigation.sh
```

### 5. **Rebuild de DevContainer**
```bash
# Rebuild rápido (desarrollo)
./scripts/rebuild-dev-quick.sh

# Rebuild completo (problemas serios)
./scripts/core/rebuild-devcontainer.sh

# Monitorear progreso (en otra terminal)
./scripts/monitor-rebuild.sh

# Verificar resultado
./scripts/verify-rebuild.sh
```

---

## 🎯 Scripts por Caso de Uso

### "Acabo de clonar el repo, ¿qué hago?"
```bash
./scripts/check_env.sh          # Verificar Node/pnpm
pnpm install                    # Instalar dependencias
./scripts/start-dev.sh          # Arrancar servicios
```

### "Algo no funciona, ¿cómo debugueo?"
```bash
./scripts/verify-repo.sh        # Verificación completa
./scripts/check-system-status.sh  # Estado del sistema
./scripts/integrity-check.sh    # Verificar integridad
```

### "Quiero hacer un commit limpio"
```bash
./scripts/clean.sh              # Limpiar build artifacts
./scripts/quick-check.sh        # Validación rápida
pnpm -w lint && pnpm -w test    # Lint y tests
```

### "Tengo vulnerabilidades en npm audit"
```bash
./scripts/safety-checks.sh      # Auditoría completa
./scripts/safe-mitigate.sh      # Mitigar automáticamente
./scripts/verify-mitigation.sh  # Verificar fix
```

### "Necesito performance metrics"
```bash
./scripts/run-k6-tests.sh       # Load testing
./scripts/express-velocity.sh   # Velocidad de arranque
./scripts/core/progress-metrics.sh  # Métricas generales
```

---

## 🔗 Referencias

- **Arquitectura:** `docs/ARCHITECTURE_REALITY.md`
- **Express Mode:** `docs/EXPRESS-VELOCITY.md`
- **Cleanup Report:** `docs/CLEANUP_REPORT_FINAL.md`
- **Scripts Audit:** `docs/SCRIPTS_AUDIT.md`
- **CI/CD:** `.github/workflows/ci.yml`

---

## 🤝 Contribuir

Al añadir nuevos scripts:
1. ✅ Añadir shebang correcto (`#!/usr/bin/env bash` o `#!/bin/bash`)
2. ✅ Incluir comentarios de documentación en header
3. ✅ Usar `set -euo pipefail` para bash strict mode
4. ✅ Añadir entrada en este README.md
5. ✅ Verificar que no duplique funcionalidad existente

---

**Mantenido por:** ECONEURA Team  
**Última limpieza:** 2025-01-07 (FASE 2 - Eliminados 9 scripts redundantes)
