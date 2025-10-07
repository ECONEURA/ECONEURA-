# FASE 3: Optimización y Consolidación Final

**Inicio:** 2025-01-07 22:20 UTC  
**Estado:** 🔄 EN PROGRESO  
**Branch:** copilot/vscode1759874622617

---

## 🎯 Objetivos de FASE 3

### 1. Scripts Consolidation ✅ (En progreso)
- **Objetivo:** Reducir redundancia y mejorar mantenibilidad
- **Acciones:**
  1. ✅ Consolidar `clean.sh` + `clean-cache.sh` → `clean-all.sh` (COMPLETADO)
  2. ⏳ Analizar `check_env.sh` vs `check-dependencies.sh` (diferentes propósitos)
  3. ⏳ Documentar scripts restantes en `scripts/README.md`

### 2. Config Files Consolidation
- **Objetivo:** Centralizar configuración en `packages/configs/`
- **Archivos objetivo:**
  - `.prettierrc` o `.prettierrc.json`
  - `.editorconfig`
  - Config dispersa en root vs packages
- **Status:** ⏳ PENDING

### 3. Code Duplication Refactoring
- **Objetivo:** Eliminar 3 clones detectados en jscpd
- **Clones a refactorizar:**
  1. ❌ jsx-runtime shims (SKIP - necesarios para Vitest)
  2. ⏳ AgentCard component (duplicado cockpit/web)
  3. ⏳ vitest.setup.ts logic consolidation
- **Status:** ⏳ PENDING

### 4. unimported Configuration
- **Objetivo:** Configurar análisis de archivos no importados
- **Acciones:**
  - Crear `.unimportedrc.json` con entry points
  - Definir entry points: apps/*/src/main.tsx, packages/*/index.ts
  - Re-ejecutar análisis
- **Status:** ⏳ PENDING

### 5. Documentation Enhancement
- **Objetivo:** Completar documentación técnica
- **Acciones:**
  - Documentar 11 servicios FastAPI en `services/neuras/README.md`
  - Expandir `docs/EXPRESS-VELOCITY.md`
  - Crear `docs/OPTIMIZATION_TODO.md` roadmap
- **Status:** ⏳ PENDING

---

## 📋 Progress Tracking

### ✅ Completado (10%)
- [x] FASE 2 push a remote (commit 12e76f4)
- [x] Crear `scripts/clean-all.sh` consolidado
- [x] Análisis inicial de scripts redundantes

### 🔄 En Progreso (0%)
- [ ] Completar análisis de check_env vs check-dependencies
- [ ] Crear documentación de scripts restantes

### ⏳ Pendiente (90%)
- [ ] Config files consolidation (.prettierrc, .editorconfig)
- [ ] AgentCard component refactoring
- [ ] vitest.setup.ts consolidation
- [ ] unimported configuration (.unimportedrc.json)
- [ ] FastAPI services documentation
- [ ] OPTIMIZATION_TODO.md roadmap
- [ ] Final commit y merge to main

---

## 🔍 Scripts Analysis

### Scripts Consolidados ✅
1. **clean-all.sh** (NUEVO)
   - Combina: `clean.sh` + `clean-cache.sh`
   - Funcionalidad: Build outputs + caches + logs cleanup
   - Tamaño: ~70 líneas (vs ~45 líneas originales)
   - **Beneficio:** Single source of truth para limpieza

### Scripts a Revisar 🔍

#### check_env.sh (33 líneas)
**Propósito:** Quick check de Node/pnpm installation
**Funcionalidad:**
- Verifica `node` en PATH
- Verifica `pnpm` en PATH
- Exit code 2 si falta alguno
- **Uso:** Pre-development setup check

#### check-dependencies.sh (288 líneas) ⚠️
**Propósito:** Comprehensive weekly dependency audit
**Funcionalidad:**
- Verifica package.json, pnpm-lock.yaml
- Instala dependencias si faltan
- Detecta outdated dependencies
- Logging extensivo a audit/dependencies/
- **Uso:** Crontab automation (weekly)

**DECISIÓN:** ✅ **MANTENER SEPARADOS**
- Diferentes casos de uso (quick check vs comprehensive audit)
- check_env.sh: lightweight, desarrollo diario
- check-dependencies.sh: heavyweight, auditoría programada
- **No consolidar** - propósitos distintos justificados

### Scripts Redundantes Confirmados ❌

**Candidatos a eliminar después de verificación:**
1. `clean.sh` → Reemplazar con `clean-all.sh`
2. `clean-cache.sh` → Reemplazar con `clean-all.sh`

---

## 📦 Config Files Analysis

### Root Config Files
```
ECONEURA-/
├── .editorconfig (?)
├── .prettierrc (?)
├── .prettierrc.json (?)
├── eslint.config.js ✅ (OK en root)
├── tsconfig.json ✅ (OK en root)
├── tsconfig.base.json ✅ (OK en root)
├── vitest.config.ts ✅ (OK en root)
└── vitest.workspace.ts ✅ (OK en root)
```

### packages/configs/
```
packages/configs/
├── package.json
├── eslint.config.js (?)
├── prettier.config.js (?)
└── tsconfig.json (?)
```

**ACTION:** Verificar existencia y consolidar si hay duplicación.

---

## 🎨 Code Duplication Plan

### Clone 1: jsx-runtime shims ✅ SKIP
**Razón:** Necesarios para Vitest JSX transformation
**Files:**
- `apps/web/test/shims/react-jsx-dev-runtime.cjs`
- `apps/web/test/shims/react-jsx-runtime.cjs`
**Action:** NO CHANGE (test infrastructure)

### Clone 2: AgentCard Component ⏳ TODO
**Duplicated between:**
- `apps/cockpit/src/EconeuraCockpit.tsx` [542:1 - 561:9]
- `apps/cockpit/src/components/AgentCard.tsx` [25:1 - 44:7]

**Refactoring Plan:**
1. Verificar ambos usos son idénticos
2. Consolidar en `apps/cockpit/src/components/AgentCard.tsx`
3. Actualizar imports en `EconeuraCockpit.tsx`
4. Considerar mover a `packages/shared` si también se usa en `apps/web`

### Clone 3: vitest.setup.ts ⏳ TODO
**Self-duplicate in:**
- `apps/cockpit/vitest.setup.ts` [32:1 - 53:6]
- `apps/cockpit/vitest.setup.ts` [7:1 - 28:2]

**Refactoring Plan:**
1. Revisar contenido del archivo
2. Identificar lógica duplicada
3. Consolidar en single setup block
4. Mantener order correcto de initialization

---

## 📊 Estimated Timeline

| Fase | Tarea | Estimación | Status |
|------|-------|------------|--------|
| 3.1 | Scripts consolidation | 30 min | 🔄 50% |
| 3.2 | Config files analysis | 20 min | ⏳ TODO |
| 3.3 | AgentCard refactoring | 15 min | ⏳ TODO |
| 3.4 | vitest.setup refactoring | 10 min | ⏳ TODO |
| 3.5 | unimported setup | 15 min | ⏳ TODO |
| 3.6 | Documentation | 30 min | ⏳ TODO |
| 3.7 | Testing & validation | 20 min | ⏳ TODO |
| 3.8 | Final commit & PR | 10 min | ⏳ TODO |
| **TOTAL** | | **~2.5 horas** | **5% done** |

---

## ✅ Success Criteria

- [ ] 2 scripts eliminados (clean.sh, clean-cache.sh)
- [ ] clean-all.sh documentado y funcionando
- [ ] Config files consolidados (si aplica)
- [ ] 2 code clones eliminados (AgentCard, vitest.setup)
- [ ] .unimportedrc.json configurado
- [ ] scripts/README.md actualizado
- [ ] docs/OPTIMIZATION_TODO.md creado
- [ ] Tests 100% passing después de cambios
- [ ] Commit limpio con mensaje descriptivo
- [ ] PR ready para merge to main

---

## 🚀 Next Immediate Actions

1. ✅ Verificar que `clean-all.sh` funciona correctamente
2. ⏳ Eliminar `clean.sh` y `clean-cache.sh`
3. ⏳ Verificar existencia de config files (.prettierrc, .editorconfig)
4. ⏳ Leer y analizar AgentCard duplicates
5. ⏳ Leer y analizar vitest.setup.ts duplicates

---

**Status Update:** Scripts consolidation iniciado. clean-all.sh creado. Pending: verificación y eliminación de originales.
