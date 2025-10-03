Artefactos generados por los pipelines rápidos

- .artifacts/install-<ts>.txt : salida de pnpm install
- .artifacts/*-lint-<ts>.txt : logs de lint por paquete
- .artifacts/*-type-<ts>.txt : logs de typecheck por paquete
- .artifacts/*-test-<ts>.txt : logs de test/coverage
- .artifacts/*-build-<ts>.txt : logs de build
- .artifacts/preview-*.log : logs de smoke/preview

Revertir stubs anteriores:
- Si quieres volver a los stubs temporales, restaura los scripts en:
  - apps/web/package.json
  - apps/cockpit/package.json
  (se añadieron scripts reales para ejecutar eslint/tsc/vitest)

Notas:
- Eliminé el archivo .eslintignore porque la nueva API de ESLint usa la propiedad `ignores` en `eslint.config.js`.
- Si el pipeline de CI muestra advertencias sobre ESLint, asegúrate de que las dependencias necesarias (eslint + plugins) estén instaladas en la raíz.
