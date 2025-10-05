# Auditoría: eliminación de `FORCE_COVERAGE` backdoor

Fecha: 2025-10-05T00:00:00Z
Actor: automated-agent

Nota: eliminación confirmada en la rama `consolidated/complete` y empujada a `origin/consolidated/complete`.

Motivo: eliminación de un mecanismo que permitía fabricar `coverage/coverage-summary.json` y por tanto posibilitaba evadir el coverage gate. Se considera un riesgo crítico de integridad y gobernanza.

Acciones realizadas:
- Eliminado archivo: `scripts/force_coverage_pass.js`
- Modificado: `.github/workflows/coverage-gate.yml` — eliminadas rutas que ejecutaban el backdoor.
- Modificado: `README.dev.md` — eliminada la referencia pública a `FORCE_COVERAGE`.

Pruebas y verificación:
- Archivo `scripts/force_coverage_pass.js` ya no existe en la rama `chore/cockpit-coverage-add`.
- El workflow ahora falla si `coverage/coverage-summary.json` no existe, evitando generación sintética.

Siguientes pasos recomendados:
- Revisar la rama/pull-request donde se introdujo originalmente el backdoor para revisar autoría y razón.
- Si se requiere desbloqueo temporal en el futuro, usar un runbook con autorización (ej.: issue + 2 aprobadores) y una herramienta de auditoría externa.

Referencias:
- commit: (ver historial git en PR asociado)
