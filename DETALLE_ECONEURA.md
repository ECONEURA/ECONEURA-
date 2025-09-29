# ECONEURA- — Estructura y Detalle Completo del Proyecto

---

## Raíz del proyecto
- **Archivos de configuración y calidad:** `.editorconfig`, `.prettierrc`, `.spectral.yml`, `.cpdignore`, `.jscpd.json`, `.lintstagedrc.js`, `.size-limit.json`, `.releaserc.json`, `.gitleaks.toml`, `.secrets.baseline`, `.lychee.toml`, `.lycheeignore`, `.env.example`, `.vitest_mode`.
- **Dependencias y lockfiles:** `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`.
- **Documentación y reportes:** `README.md`, `README.dev.md`, `AI-TERMINAL-README.md`, `AI-TERMINAL-PRO-README.md`, `AZURE-DEPLOYMENT.md`, `SECURITY_AUDIT_README.md`, `SCORECARD.md`, `PHASES_PROGRESS.md`, `REVISION-EXHAUSTIVA-README.md`, `ELIMINACION-RADICAL-COMPLETADA.md`, `MEJORAS-CRITICAS-IMPLEMENTADAS.md`, `MISION-COMPLETADA-CERO-CRUCES-ROJAS.md`, `INSTRUCCIONES-FINALES-RADICAL.md`, `GAP_F7.md`, `SOLUCION-GITHUB-ACTIONS-ERROR.md`, `analysis_report.txt`, `changed_files.txt`, `test_pr_visibility.txt`.
- **Scripts y utilidades:** `add_mock.js`, `bulk-eslint-fix.js`, `fix-unused-vars.js`, `fix-any-types.js`, `fix-request-params.js`, `fix-remaining-eslint.js`, `summary.js`, `summary_script.js`, `evidence_script.js`, `exa-boost.js`, `f0_hotfix.js`, `f1_patch.js`, `f1_fast_patch.js`, `f2_metrics.js`, `nodeploy_script.js`, `purge_secrets.js`, `scanner.js`, `temp_evidence.js`, `temp_pkg.js`, `temp_summary.js`, `tmp-f7-proxy.js`, `generate-v11-report.js`.
- **Testing y configuración:** `vitest.config.ts`, `vitest.f2.config.ts`, `vitest.integration.config.ts`, `vitest.performance.config.ts`, `vitest.workspace.json`, `vitest.workspace.ts`, `tsconfig.json`, `tsconfig.base.json`.
- **Integración y despliegue:** `docker-compose.dev.yml`, scripts PowerShell (`*.ps1`), carpetas y archivos de parches y flujos de trabajo (`patches_*`, `ci_activation_*`).
- **Otros:** `.ai_patterns`, `.ai_sessions`, `.ai_terminal_favorites`, `.ai_terminal_history`, `.ai_terminal_learned`.

---

## packages/
- **agents/**
  - `ai-router.client.ts`, `connector.d.ts`, `index.ts`, `memory.ts`, `package.json`
  - `config/`, `scripts/`, `src/`
- **config/**
  - `agent-routing.json`, `package.json`, `src/`
- **configs/**
  - `README.md`, `package.api.json`, `package.base.json`, `package.shared.json`, `package.web.json`
- **db/**
  - `drizzle.config.ts`, `env.example`, `eslint.config.js`, `package.json`, `tsconfig.json`, `tsconfig.tsbuildinfo`
  - `migrations/`, `prisma/`, `src/`
- **sdk/**
  - `package.json`, `src/`, `tsconfig.json`, `tsconfig.tsbuildinfo`
- **shared/**
  - `README.md`, `eslint.config.js`, `openapi.json`, `package.json`, `tsconfig.json`, `tsconfig.tsbuildinfo`, `vitest.config.ts`
  - `src/`

---

## services/
- **controller/**
  - `canary_monitor.py`, `health_cached.py`, `main.py`, `requirements.txt`
- **make_adapter/**
  - `app.py`
- **middleware/**
  - `finops_guard.py`
- **neuras/**
  - `analytics/`, `cdo/`, `cfo/`, `chro/`, `ciso/`, `cmo/`, `cto/`, `legal/`, `reception/`, `research/`, `support/`

---

## test/
- `setup.ts`

## tests/
- `README.md`, `configs/`, `econeura-test/`, `performance/`

---

## scripts/
- Más de 100 scripts para automatización, auditoría, despliegue, refactorización, seguridad, métricas, validaciones, limpieza, pruebas, releases, monitoreo, migraciones, etc.
- Ejemplos: `aggregate-jscpd.js`, `alert-runner.sh`, `analyze-prs.js`, `apply-config.sh`, `automated_audit_pipeline.sh`, `az-cli-in-docker.sh`, `check-dependencies.sh`, `ci_generate_score.sh`, `classify-risks.sh`, `cleanup-logs.sh`, `commit_audit_branch.sh`, `contracts/`, `deploy-azure.sh`, `eliminate-red-actions.sh`, `fix-js-imports.sh`, `infra-test.sh`, `lint-routes.mjs`, `metrics/`, `migrate-db.sh`, `monitor-critical-files.sh`, `openapi/`, `ops/`, `optimize-consolidated-services.sh`, `package_evidence.sh`, `prepare-azure-deployment.sh`, `radical-automatica-total.ps1`, `refactor/`, `release/`, `run-k6-tests.sh`, `safe-mitigate.sh`, `scan-secrets.sh`, `security/`, `setup-azure-oidc.sh`, `sign_manifest.sh`, `smoke.sh`, `start-dev.sh`, `supervisor-check.ts`, `test-advanced-features.js`, `token-red-eliminator.ps1`, `ultra-aggressive-red-eliminator.ps1`, `validate-repo.sh`, `vault/`, `verify-mitigation.sh`, `visual.sh`.

---

## monitoring/
- `dashboard_security_stub.json`

## scenarios/
- `scenario_1.json` a `scenario_50.json` (y más): Casos de uso, validaciones, simulaciones, análisis de riesgos.

## backups/
- `20250927_164117/`, `unparsable_1758992247613/`: Respaldo de datos, configuraciones, artefactos, archivos no parseables.

## mega-prompts/
- `mega_prompt_template.txt`: Plantilla para prompts avanzados de IA o automatización.

---

## ECONEURA/
- **audit/**: Evidencia, aprobaciones, integridad, manifiestos, monitoreo, logs, resultados de escaneo, simulaciones, sumarios, secretos, trazas, verificación, etc.
- **config/**: `owners.json`, `scoring.json`
- **docs/**: `SECURITY_SYSTEM.md`
- **grafana/**: `dashboard.json`, `provisioning/dashboards/security.yml`, `provisioning/datasources/prometheus.yml`
- **observability/**: `README.md`
- **playbooks/**: `invalidate-token.sh`, `redact-commit.sh`, `rotate-api-key.sh`
- **prometheus/**: `alert_rules.yml`, `alertmanager.yml`, `prometheus.yml`
- **scripts/**: `approve-tool.sh`, `approve_check.sh`, `classify-risks.sh`, `compare-tools.sh`, `git_utils.sh`, `metrics_lib.sh`, `metrics_server.sh`, `safe-mitigate.sh`, `test_metrics.sh`, `validate_gitleaks.sh`, `vault_lib.sh`

---

Este archivo resume la estructura y los principales archivos/carpetas del proyecto ECONEURA- para facilitar su exploración, documentación y referencia rápida.
