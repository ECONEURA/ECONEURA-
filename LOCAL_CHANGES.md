Resumen de cambios locales en la rama
`chore/maintenance/cleanup-types-20251004-171323` (no empujados):

1. Ajustes de ESLint

- `.eslintignore` fue respaldado y eliminado: `backups/eslintignore.bak`.

Nota: la referencia a `.eslintignore` en este documento es intencional y se usa
para documentar el respaldo. Este archivo puede contener la cadena
".eslintignore" y no indica una invocación activa a ESLint.

- `eslint.config.mjs` consolidó ignores y añadió patrones para excluir
  artefactos generados y backups.

2. Scripts y utilidades

- `scripts/release/create-release.mjs`: `create()` convertido a `async` y la
  invocación ahora maneja la promesa para evitar errores de parsing/`await`
  fuera de `async`.

3. Backups y archivado

- `backups/` creado con `README.md` y `reports/` para archivar reportes legacy.

Validaciones realizadas (local):

- `pnpm -w run lint` -> passed (exit code 0)
- `pnpm -w run ci-check` -> passed: 492 tests passed, coverage v8 All files
  96.97% statements

Siguientes pasos recomendados antes de push:

- Revisar `LOCAL_CHANGES.md` y `backups/` en equipo para confirmar que estamos
  de acuerdo con las eliminaciones.
- Ejecutar el workflow remoto en GitHub tras el push y revisar
  artefactos/coverage aggregator.
