# Instrucciones rápidas para agentes de IA (Copilot / coding agents)

Propósito: proporcionar al agente la información mínima y específica para ser
productivo de inmediato en este monorepo ECONEURA-. Incluye arquitectura
principal, comandos de desarrollo, convenciones del proyecto y ejemplos
concretos.

Resumen rápido
- Monorepo pnpm (workspace). Código en `apps/` (p.ej. `apps/web`, `apps/api_py`) y
  paquetes reutilizables en `packages/` (p.ej. `packages/shared`, `packages/config`).
- Servicios dev comunes: Cockpit web (puerto 3000), NEURA API (3101), Agents API (3102).
- Convenciones clave: TypeScript estricto, vitest para tests, cobertura mínima CI
  (Statements ≥ 90%, Functions ≥ 80%).

Comandos útiles (ejecutables desde la raíz)
- Instalar dependencias: `pnpm install` (o `pnpm -w i`).
- Arrancar todo en dev (script de conveniencia): `./scripts/start-dev.sh`.
  - Observa health checks en: `http://localhost:3000`, `http://localhost:3101`, `http://localhost:3102`.
- Arrancar solo web: `pnpm -C apps/web dev` (Vite + React).
- Lint / typecheck / tests (ejemplos):
  - `pnpm -w lint` (ESLint workspace-wide)
  - `pnpm -w typecheck` (TypeScript no-emit)
  - `pnpm -w test:coverage` (Vitest con cobertura)
  - `pnpm -w build` para compilar paquetes cuando sea necesario.

Puntos arquitectónicos imprescindibles
- Flow de alto nivel: `apps/web (React+Vite) -> apps/api_py (Python proxy) -> Make.com`.
  - Observabilidad OTLP integrada en `packages/shared` (OpenTelemetry, Winston, Redis).
- Enrutado de agentes: canonical source `packages/config/agent-routing.json` (generado dinámicamente).
  - `apps/api_py/server.py` hace forwarding a Make.com basado en rutas.
  - 60 agentes generados por `scripts/ensure-sixty.ts`: 10 deptos × 6 agentes (1 orquestador + 5 especializados).
- Código de agentes y utilidades de IA:
  - `packages/shared/src/ai/agents` contiene arquitectura de agentes autónomos.
  - Sistema de aprendizaje continuo, evaluación de confianza, workflows automatizados.
  - Agentes especializados: Sales, Operations, Compliance con capacidades específicas.

API y convenciones de request
- Endpoints importantes (ejemplos detectables en el repo):
  - `/api/health`, `/api/invoke/:agentId` (Python API)
  - Headers: `Authorization: Bearer <token>`, `X-Route: <route>`, `X-Correlation-Id: <id>`
- Arquitectura multi-API: Python (api_py) para forwarding, potenciales APIs Node.js
- Agentes identificados por `agent_key` (ej: `ceo_orquestador`, `ia_a1`, `cfo_doctor_coach`)

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
- Iniciar entorno completo: `./scripts/start-dev.sh` → servicios en 3000, 3101, 3102.
- Probar invoke de agente: `curl -H "Authorization: Bearer $TOKEN" -H "X-Route: azure" -H "X-Correlation-Id: c-1" -d '{"input":"test"}' http://localhost:3102/api/invoke/ceo_orquestador`
- Generar agentes: `tsx scripts/ensure-sixty.ts` → crea `seed/agents_master.json` con 60 agentes.
- Build workspace: `pnpm -w build` → compila todos los paquetes TypeScript.

Dónde preguntar si algo no está claro
- Si hay dudas sobre ruteo de agentes, referenciar `packages/config/agent-routing.json` y `f7-seal-ultra.ps1`.
- Para dudas sobre CI/coverage, revisar `.github/workflows/ci.yml` y scripts de CI.
- Arquitectura de agentes: `packages/shared/src/ai/agents/README.md`.

Contacto y feedback
- Después de aplicar cambios no triviales, añade un comentario corto en el PR con: comando(s) para reproducir localmente, tests ejecutados y archivos modificados.

Si algo en estas instrucciones está incompleto o contradictorio, dime qué sección quieres que amplíe y ajusto el documento.
