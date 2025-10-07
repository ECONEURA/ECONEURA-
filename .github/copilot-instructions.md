# Instrucciones rápidas para agentes de IA (Copilot / coding agents)

Propósito: proporcionar al agente la información mínima y específica para ser
productivo de inmediato en este monorepo ECONEURA-. Incluye arquitectura
principal, comandos de desarrollo, convenciones del proyecto y ejemplos
concretos.

Resumen rápido
- Monorepo pnpm (workspace). Código en `apps/` (p.ej. `apps/web`, `apps/cockpit`, `apps/api_py`) y
  paquetes reutilizables en `packages/` (p.ej. `packages/shared`, `packages/configs`).
- Servicios principales: Cockpit React (puerto 3000), API Python proxy (`apps/api_py/server.py`).
- Convenciones clave: TypeScript estricto, Vitest para tests, cobertura variable por módulo 
  (ver `vitest.config.ts` para umbrales actuales: statements ≥ 50%, functions ≥ 75%).

Comandos útiles (ejecutables desde la raíz)
- Instalar dependencias: `pnpm install` (o `pnpm -w i`).
- Arrancar todo en dev: `./scripts/start-dev.sh` (referencia servicios que pueden no existir aún).
- Arrancar solo web: `pnpm -C apps/web dev` (Vite + React en puerto 3000).
- Arrancar solo cockpit: `pnpm -C apps/cockpit dev` (esbuild + React).
- Python API server: `cd apps/api_py && python server.py` (puerto 8080 por defecto).
- Lint / typecheck / tests:
  - `pnpm -w lint` (ESLint workspace-wide)
  - `pnpm -w typecheck` (script personalizado `scripts/run-tsc.js`)
  - `pnpm -w test:coverage` (Vitest con cobertura)
  - Tests por app: `pnpm -C apps/web test:coverage` o `pnpm -C apps/cockpit test`.

Puntos arquitectónicos imprescindibles
- Flow principal: `apps/web` (React+Vite) y `apps/cockpit` (React+esbuild) → `apps/api_py` (Python proxy) → Make.com.
  - Observabilidad básica en `packages/shared` (Winston logging, config management).
- API Python simplificada: `apps/api_py/server.py` forwarding a Make.com cuando `MAKE_FORWARD=1`.
  - Rutas fijas: `neura-1` a `neura-10` (ver ROUTES en `server.py`).
  - Headers requeridos: `Authorization: Bearer <token>`, `X-Route`, `X-Correlation-Id`.
- Estructura de archivos:
  - `packages/shared/src`: utilidades compartidas (logging, config, types, clients).
  - `apps/web/src`: Cockpit React principal con `EconeuraCockpit.tsx`.
  - `apps/cockpit/src`: Cockpit alternativo más simple con esbuild.
  - Docker setup: `docker-compose.dev.yml` con Postgres, Redis.

API y convenciones de request
- Endpoints principales:
  - `/api/health` (API Python server)
  - `/api/invoke/:agentId` (POST con auth headers)
- Headers: `Authorization: Bearer <token>`, `X-Route: <route>`, `X-Correlation-Id: <id>`
- Agentes fijos: `neura-1` hasta `neura-10` (ver ROUTES en `apps/api_py/server.py`)
- Modo desarrollo: `MAKE_FORWARD=1` para proxy real, sin él simula respuestas

Dónde buscar patrones y código de referencia
- Arquitectura y políticas generales: `README.md`, `DETALLE_ECONEURA.md`.
- Librerías AI / agentes: `packages/shared/src/ai/agents/README.md` y arquitectura de agentes.
- Scripts dev y de arranque: `scripts/start-dev.sh`, `scripts/setup-dev.sh`.
- Seeds y validaciones de entorno: `scripts/ensure-sixty.ts`, `seed/agents_master.json`.
- Automatización / generación de manifiestos: `scripts/generate-manifests.sh`, `f7-seal-ultra.ps1`.

Reglas prácticas al editar
- No modificar directamente archivos generados por scripts (ej: `agent-routing.json`).
- Mantén linter y typecheck limpios antes de abrir PRs. CI falla si hay warnings/lint o cobertura insuficiente.
- Usa pnpm workspace commands (`pnpm -w`) para operaciones multi-paquete.
- Archivos críticos: `packages/shared` para utilidades compartidas, `apps/web` para UI, `apps/api_py` para backend.

Contrato mínimo para cambios propuestos por un agente
- Entrada: Path(s) afectados y una breve razón (bugfix/feature/refactor).
- Salida esperada: tests añadidos o actualizados (si aplica), build passing local (`pnpm -w build`), lint/typecheck passing.
- Errores comunes: falta de seed (menos de 60 agentes), fallos de tipado TS, imports relativos incorrectos.

Casos borde (edge cases) a detectar automáticamente
1. agentId no presente en `packages/config/agent-routing.json` → devolver 404.
2. Hooks CI: cambios que reduzcan cobertura por debajo de 90/80 → requerir tests adicionales.
3. Archivos con permisos world-writable detectados en auditoría → no tocar sin autorización humana.
4. Secrets/credentials impresos en código → detener y reportar al canal de seguridad.

Ejemplos concretos (rápidos)
- Iniciar entorno completo: `./scripts/start-dev.sh` → servicios en 3000, 8080.
- Probar API Python directamente: `curl -H "Authorization: Bearer test" -H "X-Route: azure" -H "X-Correlation-Id: c-1" -d '{"input":"test"}' http://localhost:8080/api/invoke/neura-1`
- Probar health: `curl http://localhost:8080/api/health`
- Build workspace: `pnpm -w build` → compila todos los paquetes TypeScript.

Dónde preguntar si algo no está claro
- Si hay dudas sobre ruteo de agentes, referenciar `packages/config/agent-routing.json` y `f7-seal-ultra.ps1`.
- Para dudas sobre CI/coverage, revisar `.github/workflows/ci.yml` y scripts de CI.
- Arquitectura de agentes: `packages/shared/src/ai/agents/README.md`.

Contacto y feedback
- Después de aplicar cambios no triviales, añade un comentario corto en el PR con: comando(s) para reproducir localmente, tests ejecutados y archivos modificados.

Si algo en estas instrucciones está incompleto o contradictorio, dime qué sección quieres que amplíe y ajusto el documento.
