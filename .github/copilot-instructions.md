# Instrucciones rápidas para agentes de IA (Copilot / coding agents)

Propósito: proporcionar al agente la información mínima y específica para ser
productivo de inmediato en este monorepo ECONEURA-. Incluye arquitectura
principal, comandos de desarrollo, convenciones del proyecto y ejemplos
concretos.

Resumen rápido
- Monorepo pnpm (workspace). Código en `apps/` (p.ej. `apps/web`, `apps/api`) y
  paquetes reutilizables en `packages/` (p.ej. `packages/shared`, `packages/config`).
- Servicios dev comunes: Cockpit web (puerto 3000), NEURA API (3101), Agents API (3102).
- Convenciones clave: TypeScript estricto, vitest para tests, cobertura mínima CI
  (Statements ≥ 90%, Functions ≥ 80%).

Comandos útiles (ejecutables desde la raíz)
- Instalar dependencias: `pnpm install` (o `pnpm -w i`).
- Arrancar todo en dev (script de conveniencia): `scripts/start-dev.sh`.
  - Observa health checks en: `http://localhost:3000`, `http://localhost:3101`, `http://localhost:3102`.
- Arrancar sólo web: `pnpm -C apps/web dev` (VS Code task `web:dev` también lo ejecuta).
- Lint / typecheck / tests (ejemplos):
  - `pnpm -C apps/web lint --max-warnings 0`
  - `pnpm -C apps/web typecheck`
  - `pnpm -C apps/web test:coverage`
  - `pnpm -w build` para compilar paquetes cuando sea necesario.

Puntos arquitectónicos imprescindibles
- Flow de alto nivel: `apps/web (React) -> apps/api (proxy + gobierno) -> DB(Postgres+RLS)`.
  - Observabilidad OTLP y trazas con X-Correlation-Id.
- Enrutado de agentes: canonical source `packages/config/agent-routing.json`.
  - `apps/api/src/routes/agents.ts` puede generarse/actualizarse automáticamente
    por scripts (`f7-seal-ultra.ps1`, `final_setup.sh`). Edita `agent-routing.json`
    cuando quieras cambiar destino por `agentId`.
- Código de agentes y utilidades de IA:
  - `packages/shared/src/ai/agents` contiene librería y ejemplos.
  - `packages/agents` (si existe) y `packages/config` son puntos de integración.

API y convenciones de request
- Endpoints importantes (ejemplos detectables en el repo):
  - `/v1/health`, `/v1/chat`, `/v1/agents/:id/run`, `/v1/hitl/...`
  - Internamente también hay rutas tipo `/api/invoke/:agentId` y `execute/:agentId`.
- Headers esperados en peticiones:
  - `Authorization: Bearer <token>`
  - `X-Route: <route>` (p.ej. `azure`)
  - `X-Correlation-Id: <id>` (trazabilidad)

Dónde buscar patrones y código de referencia
- Arquitectura y políticas generales: `README.md`, `DETALLE_ECONEURA.md`.
- Librerías AI / agentes: `packages/shared/src/ai/agents/README.md` y su código.
- Scripts dev y de arranque: `scripts/start-dev.sh`, `scripts/setup-dev.sh`.
- Seeds y validaciones de entorno: `scripts/ensure-sixty.ts`, `seed/agents_master.json`.
- Automatización / generación de manifiestos y auditoría: `scripts/generate-manifests.sh` y `audit/`.

Reglas prácticas al editar
- No modificar directamente archivos generados por scripts a menos que se
  documente la razón (p.ej. `apps/api/src/routes/agents.ts`). Edita `packages/config/agent-routing.json`.
- Evitar cambios en archivos de configuración sensible (`packages/agents/config/*.yaml`, `ci.keyvault.snippet.yaml`, `agents.connections.yaml`): estos aparecen en auditorías de secretos.
- Mantén linter y typecheck limpios antes de abrir PRs. CI falla si hay warnings/lint o cobertura insuficiente.

Contrato mínimo para cambios propuestos por un agente
- Entrada: Path(s) afectados y una breve razón (bugfix/feature/refactor).
- Salida esperada: tests añadidos o actualizados (si aplica), build passing local (`pnpm -w build`), lint/typecheck passing.
- Errores comunes: falta de seed (menos de 60 agentes), fallos de tipado TS, imports relativos incorrectos.

Casos borde (edge cases) a detectar automáticamente
1. agentId no presente en `packages/config/agent-routing.json` → devolver 404 y no alterar rutas.
2. Hooks CI: cambios que reduzcan cobertura por debajo de 90/80 → requerir tests adicionales.
3. Archivos con permisos world-writable detectados en auditoría → no tocar sin autorización humana.
4. Secrets/credentials impresos en código → detener y reportar al canal de seguridad (no incluir en PR).

Ejemplos concretos (rápidos)
- Iniciar entorno completo (rápido):
  - `./scripts/start-dev.sh` → espera servicios en 3000, 3101, 3102.
- Probar invoke de agente (curl):
  - `curl -s -H "Authorization: Bearer $TOKEN" -H "X-Correlation-Id: c-1" http://localhost:3102/health`
  - `curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"input":"hola"}' http://localhost:3102/api/invoke/some-agent`

Dónde preguntar si algo no está claro
- Si hay dudas sobre ruteo de agentes, referenciar `packages/config/agent-routing.json` y `f7-seal-ultra.ps1`.
- Para dudas sobre CI/coverage, revisar `.github/workflows/ci.yml` y `scripts/ci/setup-ci.sh`.

Contacto y feedback
- Después de aplicar cambios no triviales, añade un comentario corto en el PR con: comando(s) para reproducir localmente, tests ejecutados y archivos modificados.

Si algo en estas instrucciones está incompleto o contradictorio, dime qué sección quieres que amplíe y ajusto el documento.
