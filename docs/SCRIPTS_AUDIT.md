# Scripts Audit Report - ECONEURA Monorepo

**Fecha:** 2025-01-07  
**Estado:** FASE 2 - Auditoría de scripts redundantes  
**Objetivo:** Identificar duplicación, consolidar funcionalidad, reducir deuda técnica

---

## 🔍 Resumen Ejecutivo

**Total de scripts encontrados:** ~50 archivos (.sh + .ps1 + .js)  
**Redundancias críticas identificadas:** 12 grupos de duplicación  
**Scripts potencialmente eliminables:** ~15-20 archivos  
**Complejidad total estimada:** ~5000-6000 líneas de bash/powershell

### Métricas de duplicación

| Categoría | Scripts duplicados | Líneas aproximadas | Impacto |
|-----------|-------------------|-------------------|---------|
| Limpieza (cleanup/clean) | 3 archivos | ~500 líneas | 🔴 ALTO |
| Validación (validate/verify/check) | 6 archivos | ~800 líneas | 🔴 ALTO |
| Rebuild/Dev setup | 4 archivos | ~600 líneas | 🟡 MEDIO |
| PowerShell ONE_SHOT variants | 5 archivos | ~1000 líneas | 🟡 MEDIO |
| Express/velocity scripts | 3 archivos | ~300 líneas | 🟢 BAJO |

---

## 📊 Grupos de Redundancia Detectados

### 1. **GRUPO LIMPIEZA** 🔴 CRÍTICO

**Scripts duplicados:**
- `scripts/clean-monorepo.sh` (377 líneas)
- `scripts/cleanup-monorepo.sh` (109 líneas)
- `scripts/clean.sh` (12 líneas - minimalista)
- `scripts/clean-cache.sh` (funcionalidad específica)

**Funcionalidad compartida:**
- Eliminación de `node_modules/`, `dist/`, `.next/`, `.cache/`
- Borrado de archivos `.bak`, `.backup`, `.tmp`
- Limpieza de tsbuildinfo
- Regeneración de lockfiles

**Recomendación:**
- ✅ **MANTENER:** `scripts/clean.sh` (script rápido para desarrollo)
- ✅ **MANTENER:** `scripts/core/prioritized-cleanup.sh` (versión consolidada post-PR92)
- ❌ **ELIMINAR:** `clean-monorepo.sh` (obsoleto, 377 líneas redundantes)
- ❌ **ELIMINAR:** `cleanup-monorepo.sh` (obsoleto, 109 líneas redundantes)
- ⚠️ **REVISAR:** `clean-cache.sh` (verificar si funcionalidad está en prioritized-cleanup)

---

### 2. **GRUPO VALIDACIÓN** 🔴 CRÍTICO

**Scripts duplicados:**
- `scripts/validate-repo.sh` (132 líneas)
- `scripts/verify-repo.sh` (273 líneas - más completo)
- `scripts/check_env.sh` (33 líneas - Node/pnpm)
- `scripts/validate_env.sh` (27 líneas - jq/git/curl/trufflehog)
- `scripts/validate-architecture.sh`
- `scripts/core/validate-environment.sh`

**Funcionalidad compartida:**
- Verificación de dependencias del sistema (node, pnpm, jq, git)
- Validación de estructura de archivos del monorepo
- Checks de configuración (package.json, tsconfig, etc.)
- Reportes con colores y contadores (PASSED/FAILED)

**Recomendación:**
- ✅ **MANTENER:** `scripts/check_env.sh` (script rápido para contributors, 33 líneas, propósito claro)
- ✅ **MANTENER:** `scripts/core/validate-environment.sh` (consolidado oficial)
- ❌ **ELIMINAR:** `validate-repo.sh` (132 líneas, funcionalidad en verify-repo.sh)
- ⚠️ **CONSOLIDAR:** `verify-repo.sh` con `validate-environment.sh` (eliminar duplicación de checks)
- ❌ **ELIMINAR:** `validate_env.sh` (27 líneas, requiere jq - funcionalidad cubierta por check_env.sh)

---

### 3. **GRUPO REBUILD/DEVCONTAINER** 🟡 MEDIO

**Scripts duplicados:**
- `scripts/auto-rebuild-devcontainer.sh`
- `scripts/rebuild-container-v2.sh`
- `scripts/rebuild-dev-quick.sh`
- `scripts/core/rebuild-devcontainer.sh`
- `scripts/monitor-rebuild.sh`
- `scripts/verify-rebuild.sh`

**Funcionalidad compartida:**
- Rebuild de devcontainer completo o rápido
- Monitoreo de proceso de rebuild
- Verificación post-rebuild
- Rollback en caso de fallo

**Recomendación:**
- ✅ **MANTENER:** `scripts/core/rebuild-devcontainer.sh` (script oficial consolidado)
- ✅ **MANTENER:** `scripts/rebuild-dev-quick.sh` (modo rápido para desarrollo)
- ❌ **ELIMINAR:** `auto-rebuild-devcontainer.sh` (funcionalidad en core/rebuild-devcontainer.sh)
- ❌ **ELIMINAR:** `rebuild-container-v2.sh` (versión obsoleta)
- ⚠️ **REVISAR:** `monitor-rebuild.sh` y `verify-rebuild.sh` (verificar si son invocados por otros scripts)

---

### 4. **GRUPO POWERSHELL ONE_SHOT** 🟡 MEDIO

**Scripts duplicados:**
- `scripts/powershell/ONE_SHOT_100_v8.ps1`
- `scripts/powershell/ONE_SHOT_100_v10.ps1`
- `scripts/powershell/ONE_SHOT_100_v12.ps1`
- `scripts/powershell/ONE_SHOT_100_v13.ps1`
- `scripts/powershell/ONE_SHOT_COVERAGE.ps1`

**Análisis:**
- Scripts versionados (v8, v10, v12, v13) sugieren evolución iterativa
- Posiblemente experimentales o PRs anteriores
- Coverage tiene propósito específico

**Recomendación:**
- ✅ **MANTENER:** `ONE_SHOT_100_v13.ps1` (última versión estable)
- ✅ **MANTENER:** `ONE_SHOT_COVERAGE.ps1` (propósito específico)
- ❌ **ELIMINAR:** v8, v10, v12 (versiones obsoletas - git history preserva evolución)
- ⚠️ **DOCUMENTAR:** Propósito de ONE_SHOT en `scripts/powershell/README.md`

---

### 5. **GRUPO EXPRESS/VELOCITY** 🟢 BAJO

**Scripts relacionados:**
- `scripts/express-dev-start.sh`
- `scripts/express-status.sh`
- `scripts/express-velocity.sh`
- `scripts/express-aliases.sh`

**Análisis:**
- Scripts relacionados con "Express Mode" (desarrollo rápido)
- Propósitos diferenciados (start, status, velocity check, aliases)
- No hay duplicación de funcionalidad evidente

**Recomendación:**
- ✅ **MANTENER TODOS:** Funcionalidad diferenciada y útil
- ✅ **DOCUMENTAR:** Añadir README en docs/ explicando Express Mode

---

### 6. **GRUPO VALIDATE_WITH_CACHE/GITLEAKS** 🟢 BAJO

**Scripts específicos:**
- `scripts/validate_with_cache.sh`
- `scripts/validate_gitleaks.sh`

**Análisis:**
- Propósitos muy específicos (validación con caché, secret scanning)
- No hay duplicación con otros scripts

**Recomendación:**
- ✅ **MANTENER AMBOS:** Funcionalidad única y valiosa

---

## 🗂️ Otros Scripts Analizados

### Scripts únicos y funcionales ✅
- `scripts/start-dev.sh` - Inicio de servicios dev (referenciado en README)
- `scripts/run-tsc.js` - TypeScript checker custom (usado en pnpm typecheck)
- `scripts/vitest-atomic-reporter.cjs` - Reporter CI/CD (creado en FASE 1)
- `scripts/generate-manifests.sh` - Generación de manifests
- `scripts/run-k6-tests.sh` - Performance testing con k6
- `scripts/infra-test.sh` - Testing de infraestructura
- `scripts/smoke.sh` - Smoke tests
- `scripts/visual.sh` - Tests visuales
- `scripts/quick-check.sh` - Validación rápida
- `scripts/safety-checks.sh` - Checks de seguridad
- `scripts/safe-mitigate.sh` - Mitigación de vulnerabilidades
- `scripts/verify-mitigation.sh` - Verificación de mitigaciones
- `scripts/integrity-check.sh` - Checks de integridad
- `scripts/check-system-status.sh` - Status del sistema
- `scripts/check-dependencies.sh` - Verificación de dependencias
- `scripts/comprehensive-test-suite.sh` - Suite completa de tests
- `scripts/automatic-documentation.sh` - Generación de docs automática
- `scripts/sync-codespaces.sh` - Sincronización de Codespaces
- `scripts/apply-config.sh` - Aplicar configuración
- `scripts/validate-types.sh` - Validación de tipos TypeScript
- `scripts/validate-cicd.sh` - Validación de CI/CD

### Scripts en subdirectorios ✅
- `scripts/core/prioritized-cleanup.sh` - Limpieza priorizada (FASE 2)
- `scripts/core/validate-project.sh` - Validación de proyecto
- `scripts/core/progress-metrics.sh` - Métricas de progreso
- `scripts/core/rollback.sh` - Rollback de cambios

### Scripts PowerShell adicionales 📝
- `scripts/powershell/COVERAGE_SNAPSHOT_NANO.ps1`
- `scripts/powershell/STATUS_90D_MINI.ps1`
- `scripts/powershell/STATUS_COV_DIFF_FAST.ps1`

**Análisis:** Propósitos específicos (coverage snapshots, status checks). Revisar si son activamente usados en CI/CD.

---

## 📋 Plan de Acción - Consolidación

### Fase Inmediata (AHORA)

1. **ELIMINAR scripts redundantes de limpieza:**
   ```bash
   rm scripts/clean-monorepo.sh        # 377 líneas → core/prioritized-cleanup.sh
   rm scripts/cleanup-monorepo.sh      # 109 líneas → core/prioritized-cleanup.sh
   ```

2. **ELIMINAR scripts obsoletos de validación:**
   ```bash
   rm scripts/validate-repo.sh         # 132 líneas → verify-repo.sh o core/validate-environment.sh
   rm scripts/validate_env.sh          # 27 líneas → check_env.sh
   ```

3. **ELIMINAR versiones antiguas de rebuild:**
   ```bash
   rm scripts/auto-rebuild-devcontainer.sh  # → core/rebuild-devcontainer.sh
   rm scripts/rebuild-container-v2.sh       # versión v2 obsoleta
   ```

4. **ELIMINAR versiones antiguas PowerShell:**
   ```bash
   rm scripts/powershell/ONE_SHOT_100_v8.ps1
   rm scripts/powershell/ONE_SHOT_100_v10.ps1
   rm scripts/powershell/ONE_SHOT_100_v12.ps1
   # MANTENER: v13 (última estable) y COVERAGE (propósito específico)
   ```

### Fase Corto Plazo (FASE 3)

5. **CONSOLIDAR verify-repo.sh con validate-environment.sh:**
   - Revisar funcionalidad única de cada uno
   - Fusionar en `core/validate-environment.sh`
   - Actualizar referencias en tasks.json y CI/CD

6. **DOCUMENTAR scripts restantes:**
   - Crear `scripts/README.md` con índice de scripts y propósitos
   - Documentar Express Mode en docs/
   - Añadir comentarios en headers de scripts complejos

7. **REVISAR scripts PowerShell poco usados:**
   - Verificar si STATUS_90D_MINI, STATUS_COV_DIFF_FAST son usados en CI
   - Si no: considerar eliminación o mover a `archive/`

---

## 📈 Impacto Estimado

### Reducción de código
- **Scripts eliminados:** ~10-12 archivos
- **Líneas de código eliminadas:** ~1500-2000 líneas
- **Reducción de complejidad:** ~30% menos scripts en `scripts/`

### Mejoras
- ✅ Claridad: Menos scripts = menos confusión para contributors
- ✅ Mantenibilidad: Menos duplicación = menos lugares para arreglar bugs
- ✅ Performance: Menos archivos en disco = indexación más rápida
- ✅ Documentación: Scripts restantes bien documentados y organizados

---

## ✅ Siguientes Pasos (AHORA)

1. **EJECUTAR:** Eliminación de scripts redundantes identificados
2. **VERIFICAR:** Tests y CI/CD no rotos (`pnpm -w test && pnpm -w lint`)
3. **COMMIT:** Cambios con mensaje descriptivo
4. **CREAR:** `scripts/README.md` con índice de scripts consolidados
5. **PUSH:** A GitHub main branch
6. **PROCEDER:** A FASE 3 (Optimización final)

---

**Autor:** GitHub Copilot (AI Agent)  
**Revisión requerida:** Validar que scripts eliminados no sean referenciados en `.github/workflows/`, `tasks.json`, o otros scripts
