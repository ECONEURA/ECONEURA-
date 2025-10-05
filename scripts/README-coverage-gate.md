Coverage gate helper

Este script en `scripts/coverage-gate.js` verifica un porcentaje mínimo de cobertura.

Uso:

node scripts/coverage-gate.js --threshold 95 --metric statements

Opciones:
- --threshold, -t : umbral numérico (por defecto 95)
- --metric, -m : una de statements|lines|branches|functions (por defecto statements)

Salida:
- Crea `coverage/coverage-gate-result.json` con el resultado (útil para artefactos o comentarios de CI).
- Exit codes: 0 = passed, 2 = failed threshold, 1 = no coverage encontrado/errores.

Recomendaciones:
- Preferir `coverage/coverage-summary.json` (v8/istanbul) para precisión en "statements".
- Si se usa `lcov.info` el script aproxima métricas de lines/branches/functions.
