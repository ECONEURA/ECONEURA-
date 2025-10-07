# Instrucciones rápidas para agentes de IA (Copilot / coding agents)

Propósito: proporcionar al agente la información mínima y específica para ser
productivo de inmediato en este monorepo ECONEURA-. Incluye arquitectura
principal, comandos de desarrollo, convenciones del proyecto y ejemplos
concretos.

⚠️ **IMPORTANTE:** El README.md describe el estado OBJETIVO (100% GA). Este documento describe la REALIDAD ACTUAL del código. Ver `docs/ARCHITECTURE_REALITY.md` para detalles completos de las diferencias.

## Resumen rápido
- **Monorepo pnpm** (workspace). Código en `apps/` (web, cockpit, api_py) y paquetes en `packages/` (shared, configs).
- **Servicios dev:** Cockpit web (puerto 3000), Python proxy API (puerto 8080), 11 servicios FastAPI en `services/neuras/`.
- **Convenciones:** TypeScript estricto, Vitest para tests, ESLint con `--max-warnings 0`.
- **Coverage CI:** Statements ≥ 50%, Functions ≥ 75%, Branches ≥ 45% (temporalmente relajado).

## Comandos útiles (ejecutables desde la raíz)
- **Instalar dependencias:** `pnpm install` (o `pnpm -w i`)
- **Arrancar todo en dev:** `./scripts/start-dev.sh` (health checks: `localhost:3000`, `localhost:3101`, `localhost:3102`)  
- **Arrancar solo web:** `pnpm -C apps/web dev` (Vite + React)
- **Lint/typecheck/tests:**
  - `pnpm -w lint` (ESLint workspace-wide, falla con warnings)
  - `pnpm -w typecheck` (TypeScript no-emit usando `scripts/run-tsc.js`)  
  - `pnpm -w test:coverage` (Vitest con thresholds)
  - `pnpm -w build` (compila paquetes TypeScript compartidos)

## Puntos arquitectónicos imprescindibles (REALIDAD ACTUAL)
- **Flow principal:** `apps/web (React+Vite) → apps/api_py/server.py (Python proxy puerto 8080) → Make.com`
  - `apps/api_py/server.py`: Proxy HTTP simple (~65 líneas Python stdlib) sin dependencias externas
  - Con `MAKE_FORWARD=1`: enruta a Make.com webhooks. Sin flag: modo simulación (echo)
  - Observabilidad OTLP: código stub en `packages/shared`, no completamente integrado
- **Enrutado de agentes:** 
  - ❌ NO existe `packages/config/agent-routing.json` en el repo
  - ✅ `apps/api_py/server.py` hardcodea 10 rutas: `neura-1` a `neura-10` (línea 4)
  - ❌ `scripts/ensure-sixty.ts` NO está implementado
  - ✅ 11 servicios FastAPI en `services/neuras/`: analytics, cdo, cfo, chro, ciso, cmo, cto, legal, reception, research, support
- **Frontend apps:**
  - `apps/web/`: Cockpit principal React+Vite (puerto 3000 en dev)
  - `apps/cockpit/`: Segundo cockpit (propósito sin documentar claramente)
- **AI/Agents:** `packages/shared/src/ai/agents` (arquitectura de agentes autónomos, parcialmente implementado)

## API y convenciones de request (REALIDAD ACTUAL)
- **Endpoints** en `apps/api_py/server.py`:
  - `GET /api/health`: Devuelve `{"ok":True,"mode":"forward"|"sim","ts":"..."}`
  - `POST /api/invoke/:agentId`: Enruta a Make.com o simula. Acepta: `neura-1` a `neura-10`
  - **Headers requeridos:** `Authorization: Bearer <token>`, `X-Route: <route>`, `X-Correlation-Id: <id>`
- **Respuestas de error:** Sin `Authorization` o headers → 401/400. AgentId no válido → 404
- **Variables de entorno:** `MAKE_FORWARD=1` (activa forwarding), `MAKE_TOKEN` (auth), `PORT` (default 8080)

## Dónde buscar patrones y código de referencia
- **Arquitectura real vs documentada:** `docs/ARCHITECTURE_REALITY.md` (LEER PRIMERO)
- **Arquitectura objetivo:** `README.md` (describe visión 100% GA, no estado actual)
- **AI/Agents:** `packages/shared/src/ai/agents/README.md` (parcialmente implementado)
- **Servicios FastAPI:** `services/neuras/*/app.py` (11 microservicios independientes)
- **Proxy Python:** `apps/api_py/server.py` (simple, sin frameworks, stdlib only)
- **Frontend:** `apps/web/` (Cockpit principal) y `apps/cockpit/` (propósito TBD)

## Reglas prácticas al editar
- ⚠️ `packages/config/` NO existe. El directorio correcto es `packages/configs/` (con 's')
- ⚠️ NO hay `agent-routing.json` generado. Las rutas están hardcoded en `apps/api_py/server.py`
- **Mantén linter y typecheck limpios** antes de abrir PRs. CI falla si hay warnings/lint o cobertura insuficiente
- **Coverage actual:** statements ≥ 50%, functions ≥ 75% (temporalmente relajado, ver vitest.config.ts)
- **Usa pnpm workspace commands** (`pnpm -w`) para operaciones multi-paquete
- **Archivos críticos:** `packages/shared` para utilidades compartidas, `apps/web` para UI, `apps/api_py` para backend proxy

## Contrato mínimo para cambios propuestos por un agente
- **Entrada:** Path(s) afectados y una breve razón (bugfix/feature/refactor)
- **Salida esperada:** tests añadidos o actualizados (si aplica), build passing local (`pnpm -w build`), lint/typecheck passing
- **Errores comunes:** falta de seed (menos de 60 agentes), fallos de tipado TS, imports relativos incorrectos

## Casos borde (edge cases) a detectar automáticamente
1. **agentId no en lista** `neura-1` a `neura-10` en `apps/api_py/server.py` → devolver 404
2. **Hooks CI:** cambios que reduzcan cobertura por debajo de 50/75 → requerir tests adicionales
3. **Archivos con permisos world-writable** detectados en auditoría → no tocar sin autorización humana
4. **Secrets/credentials impresos** en código → detener y reportar al canal de seguridad
5. **Referencias a `packages/config`** (singular) → corregir a `packages/configs` (plural)

## Ejemplos concretos (rápidos)
- **Iniciar frontend:** `pnpm -C apps/web dev` → http://localhost:3000
- **Iniciar proxy Python:** `cd apps/api_py && PORT=8080 python server.py` → http://localhost:8080
- **Probar health:** `curl http://localhost:8080/api/health`
- **Probar invoke (modo sim):** `curl -H "Authorization: Bearer test123" -H "X-Route: azure" -H "X-Correlation-Id: c-1" -H "Content-Type: application/json" -d '{"input":"test"}' http://localhost:8080/api/invoke/neura-1`
- **Probar invoke (forward a Make):** `MAKE_FORWARD=1 MAKE_TOKEN=xxx python apps/api_py/server.py` luego curl igual
- **Build workspace:** `pnpm -w build` → compila todos los paquetes TypeScript
- **Tests:** `pnpm -w test` o `pnpm -w test:coverage`

## Dónde preguntar si algo no está claro
- **SIEMPRE LEER PRIMERO:** `docs/ARCHITECTURE_REALITY.md` para entender qué existe vs qué es visión
- **Si hay dudas sobre ruteo de agentes,** revisar `apps/api_py/server.py` líneas 1-15
- **Para dudas sobre CI/coverage,** revisar `.github/workflows/ci.yml` y `vitest.config.ts`
- **Arquitectura de agentes:** `packages/shared/src/ai/agents/README.md` (implementación parcial)
- **Servicios FastAPI:** explorar `services/neuras/` directamente

## Contacto y feedback
- **Después de aplicar cambios no triviales,** añade un comentario corto en el PR con: comando(s) para reproducir localmente, tests ejecutados y archivos modificados

**Si algo en estas instrucciones está incompleto o contradictorio, dime qué sección quieres que amplíe y ajusto el documento.**
