Automation prompt (do not modify):

Sigue este plan de acción automatizado para mantener y mejorar el repo ECONEURA- durante el periodo automático:

1) Objetivo principal
- Dejar el repositorio en un estado funcional: tests verdes, cobertura >80%, y ruido de lint aceptable. Prioriza cambios que son reversibles y que no rompen la API pública.

2) Reglas ejecutables (siempre aplicables)
- No modifiques datos secretos ni archivos en `backups/` sin aprobación explícita.
- Cuando apliques cambios que puedan causar fallo en CI, añade un commit separado y una nota en el PR explicando por qué.
- Prefiere cambios no invasivos: anotaciones `// eslint-disable-next-line`, ajustes de config, tests que cubran módulos vacíos.

3) Orden de trabajo automático (iterativo)
A. Reducir ruido de lint
  - Relaja reglas ruidosas temporalmente en `eslint.config.mjs` (por ejemplo `@typescript-eslint/no-explicit-any`) y commitea.
  - Ejecuta `pnpm exec eslint` con `--fix` en `packages/**/src/**` y `apps/**/src/**`.
  - Añade anotaciones `// eslint-disable-next-line` donde `--fix` no pueda solucionar el warning y el cambio sea costoso.

B. Subir cobertura
  - Prioriza escribir tests en `packages/shared/src` y `src/clients` para los archivos con 0%.
  - Añade tests simples que comprueben comportamiento puro (inputs->outputs) o validen esquemas.

C. Validación final
  - Ejecuta `pnpm test` y genera el reporte en `reports/vitest.json`.
  - Asegúrate que `vitest.config.ts` y `apps/web/vitest.config.ts` no rompan la ejecución en CI (usa `pnpm.overrides` para paquetes conflictivos).

4) Commits y PRs
- Divide cambios en commits lógicos y descriptivos.
- Al terminar un ciclo (A→B→C) crea o actualiza un PR draft con `docs/PR_DRAFT_fix_cockpit.md` como descripción.

5) Permisos y límites
- Si `gh` no está autenticado, sube la rama y guarda el PR draft en `docs/PR_DRAFT_fix_cockpit.md`.
- No hagas push a `main` sin revisión humana.

6) Reporte diario automático
- Al final de cada ciclo, actualiza `docs/PROGRESS.md` con:
  - acciones realizadas
  - tests y cobertura
  - warnings de lint restantes
  - próximos pasos

---

Nota: Este archivo es usado por el asistente automatizado para guiar las acciones. Puedes editarlo manualmente para cambiar política, pero el asistente solo aplicará cambios si el nuevo prompt permite la acción.
