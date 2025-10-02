Título: [fix] Unificar React, arreglar tests y subir cobertura (branch: fix/cockpit-20250930-125729)

Resumen breve
- Forzado de una única instancia de React (v18.3.1) mediante:
  - `pnpm.overrides` en `package.json` (react y react-dom).
  - shims CJS para `react/jsx-runtime` y `react/jsx-dev-runtime` y aliases en los `vitest.config.ts`.
  - Guard `scripts/ensure-local-react.js` ejecutado como `pretest` para detectar resoluciones incompatibles.
- Ajustes en `vitest.config.ts` para optimizar resolución y cobertura temporal.
- Añadidos tests unitarios en `packages/shared` (config, service-client, logging) para incrementar cobertura.
- Ajustes de lint (restringir globs) para evitar que `dist/`/artefactos rompan el flujo.

Archivos clave modificados/añadidos
- package.json (root): `pretest`, `pnpm.overrides`, ajustes de lint scripts.
- vitest.config.ts (root): aliases, deps.inline/opimizeDeps, coverage include/exclude y thresholds temporales.
- scripts/ensure-local-react.js: pretest guard para evitar que tests fallen por múltiples instancias de React.
- test/shims/react-jsx-runtime.cjs
- test/shims/react-jsx-dev-runtime.cjs
- packages/shared/src/__tests__/config.unit.test.ts
- packages/shared/src/__tests__/service-client.test.ts
- packages/shared/src/__tests__/logging.unit.test.ts
- docs/REACT_RESOLUTION.md (documentación de la intervención local en node_modules)

Estado de verificación (local)
- Comando ejecutado: `pnpm test --reporter=json` (PowerShell)
- Resultado: 48 archivos de test ejecutados, 318 tests pasaron.
- Cobertura (provider v8): statements/lines = 80.59%, branches = 90.15%, functions = 90.27%.
- JSON report generado: `reports/vitest.json`.

Notas importantes
- Se realizaron intervenciones locales en el filesystem (renombrados a `.bak` y creación de junctions) para forzar resolución en mi entorno; están documentadas en `docs/REACT_RESOLUTION.md`. Estas maniobras son locales y no son necesarias si `pnpm.overrides` y las aliases funcionan en CI.
- Algunos módulos siguen con 0% de cobertura (p. ej. `packages/shared/src/ai/cost-utils.ts`, `packages/shared/src/events.ts`, varias definiciones de tipos/schemas). Requieren tests adicionales.
- Quedan ~85 advertencias de ESLint; no son errores pero conviene ir limpiándolas.

Checklist para PR
- [ ] Confirmar que `pnpm install` en runner limpio (CI) no reproduce la necesidad de junctions locales.
- [ ] Ejecutar `pnpm test` en CI y validar que los tests y la cobertura pasan con los thresholds.
- [ ] Revisar y aprobar los cambios (preferible revisar `vitest` aliases y `pnpm.overrides`).
- [ ] Merge y, si procede, remover documentación temporal o notas sobre `.bak` si no son necesarias.

Comandos útiles para verificar localmente (PowerShell)
```
# Instala dependencias de monorepo
pnpm install --prefer-frozen-lockfile

# Ejecuta lint (sólo en fuentes)
pm run lint -- --no-error-on-unmatched-pattern

# Ejecuta tests con reporte y cobertura
pnpm test --reporter=dot

# Ejecuta tests y genera report JSON
pnpm test --reporter=json

# Abrir reporte HTML de cobertura (si está configurado)
Start-Process "reports/vitest-coverage/index.html"
```

Siguientes pasos recomendados (puedo automatizar)
1. Ejecutar en un CI runner limpio para validar que `pnpm.overrides` y aliases son suficientes. Si quieres, lo intento abrir un PR y ejecutar los pipelines (necesitaré permiso para push/create PR si quieres que lo haga automáticamente).
2. Priorizar tests para módulos sin cobertura (empezar por `packages/shared/*` que son puros y fáciles de cubrir). Puedo generar un lote de tests rápidos y reaplicar hasta alcanzar objetivo de cobertura.
3. Corregir advertencias ESLint por prioridad (evitar `any` inseguro, variables no usadas y reglas de console) y reducir ruido en PRs.

¿Quieres que cree y empuje un commit con estos cambios y genere el PR draft automáticamente? Si sí, doy el siguiente paso: crear commit, push al branch `fix/cockpit-20250930-125729` y abrir un PR draft en GitHub con este cuerpo. Si prefieres revisar primero, dime qué quieres cambiar en el texto del PR.