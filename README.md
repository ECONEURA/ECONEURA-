````markdown
# ECONEURA · Control plane de IA para empresas
**Gestiona IA sobre tu <sistema>. No sustituimos ERP/CRM.**

[![GA](https://img.shields.io/badge/Release-GA_100%25-brightgreen)](#)
[![EU-first](https://img.shields.io/badge/EU-first-blue)](#)
[![HITL](https://img.shields.io/badge/HITL-audit-orange)](#)
[![FinOps](https://img.shields.io/badge/FinOps-EUR_por_tarea_p95-9cf)](#)
[![SLO](https://img.shields.io/badge/API_p95-<1500_ms-informational)](#)
[![Coverage](https://img.shields.io/badge/Coverage-Statements_%E2%89%A5_90%25,_Functions_%E2%89%A5_80%25-success)](#)

ECONEURA es el plano de control de IA para PYMEs y mid-market de la UE. Orquesta agentes de IA **sobre tu stack existente** con gobierno operativo completo: **HITL, DLP, RLS, FinOps y observabilidad OTel**. Sin migraciones traumáticas. Sin lock-in. Con resultados medibles.

---

## Por qué ECONEURA
- **Sobre tu stack**: conectamos IA a tus sistemas actuales. No sustituimos ERP/CRM/HRIS.
- **Gobierno desde el día 0**: HITL, DLP y auditoría incluidos por diseño.
- **FinOps real**: medimos EUR por tarea p95, cuotas y alertas de variación.
- **EU-first**: datos en la UE, RLS por tenant, cifrado y evidencias.
- **Tiempo a valor < 7 días**: cockpit, agentes y flujos listos para pilotar.

---

## Qué incluye
- **Cockpit web** con 10 áreas ejecutivas (CEO, IA, CSO, CTO, CISO, COO, CHRO, CGO, CFO, CDO).
- **60 agentes** (5 por área) listos para conectar a tu stack y a Make.com.
- **Chat por área** con contexto, sugerencias y registro de actividad.
- **KPIs rápidos** y **timeline** con eventos ok, warn, err.
- **Controles FinOps**: consumo por agente, EUR estimado, límites y hard-stop.
- **HITL** con estados pending, approved, rejected y escalado.
- **DLP** con detecciones de PII, enmascarado y allowlists justificadas.
- **Observabilidad OTel** end-to-end y SLOs recomendados.

---

## Arquitectura (alto nivel)
```mermaid
flowchart LR
  User-->Cockpit[apps/web (React)]
  Cockpit--->API[apps/api (proxy IA)]
  API--PG-->DB[(Postgres + RLS)]
  API--OIDC-->AAD[(Azure AD OIDC)]
  API--Cache-->KV[(KV/Redis)]
  API--OTLP-->OTel[(OTel Collector)]
  API--Make-->Make[Make.com]
  API--Models-->LLM[(Modelos on-prem y cloud)]
  OTel-->APM[(App Insights / Tempo / Grafana)]
````

---

## Cockpit en detalle

* **Navegación por áreas**: selector lateral con paleta por perfil ejecutivo.
* **Tarjetas de agente**:

  * Estado: activo o en ejecución, barra de progreso y ETA.
  * Uso: tokens, EUR estimado, tiempo y llamadas.
  * Acciones: Ejecutar, Pausar, Conectar Make.
* **NEURA ejecutivo** por área: chat contextual con atajos “Resumen del día”, “Top riesgos”, etc.
* **Accesibilidad**: roles ARIA, foco, teclas rápidas (/ para buscar, O para organigrama).
* **Mensaje fijo de marca**: “Gestiona IA sobre tu <sistema>. No sustituimos ERP/CRM.”

> Coloca capturas reales en `docs/img/cockpit.png`, `docs/img/hitl.png`, `docs/img/finops.png`.

---

## Áreas y agentes (lista abreviada)

* **CEO**: NEURA-CEO, Agenda Consejo, Anuncio Semanal, Resumen Ejecutivo Diario, Seguimiento OKR.
* **IA**: NEURA-IA, Chequeo de Salud y Failover, Cost Tracker, Revisión de Prompts, Vigilancia de Cuotas.
* **CSO**: NEURA-CSO, Gestor de Riesgos, Radar de Tendencias, Sincronización de M&A, Vigilancia Competitiva.
* **CTO**: NEURA-CTO, FinOps Cloud, Observabilidad y SLO, Gestión de Incidencias, Seguridad CI/CD.
* **CISO**: NEURA-CISO, Vulnerabilidades y Parches, Phishing Triage, Backup/Restore DR, Recertificación de Accesos.
* **COO**: NEURA-COO, Atrasos y Excepciones, Centro NPS/CSAT, Latido de SLA, Torre de Control.
* **CHRO**: NEURA-CHRO, Encuesta de Pulso, Offboarding Seguro, Onboarding Orquestado, Pipeline de Contratación.
* **CGO**: NEURA-CGO, Calendario de Contenidos, Campañas Email, Lead Scoring + Enriquecimiento, Ads ROI Optimizer.
* **CFO**: NEURA-CFO, Dunning Inteligente, Gasto Anómalo, MRR/ARR Ledger, Pronóstico de Caja 30/90.
* **CDO**: NEURA-CDO, Calidad de Datos, Gobernanza/Privacidad (GDPR), Registro de Accesos a PII, Catálogo y Linaje.

---

## Gobierno operativo

### HITL

```mermaid
stateDiagram-v2
  [*] --> pending
  pending --> approved
  pending --> rejected
  pending --> escalated
  escalated --> approved
  escalated --> rejected
  approved --> [*]
  rejected --> [*]
```

* Reglas por criticidad y confidencialidad.
* Auditoría: timestamp, actor, motivo y artefacto.
* SLA por rol con reintentos controlados y trazabilidad completa.

### DLP

* Detección: NIF, DNI, IBAN, email personal y dominios restringidos.
* Acciones: enmascarado selectivo, bloqueo, allowlist con justificación.
* Políticas por tenant y por canal. Export de evidencias.

### RLS

* Aislamiento por tenant en la base de datos.
* Scopes por rol: lectura, ejecución, auditoría.

### FinOps

* Presupuestos por tenant y por agente.
* Límites diarios y mensuales con **hard-stop**.
* Métricas: **EUR por tarea p95** y **fallback ratio** por proveedor/modelo.
* Alertas de cuota y de desviación de consumo.

---

## Observabilidad y SLO

* Export **OTLP** hacia App Insights o backend OTel compatible.
* **X-Correlation-Id** en API, workers y agentes.
* Dashboards: latencia p95, tasa de error, throughput, consumo IA.
* SLOs recomendados:

  * API p95 < 1500 ms
  * UI p95 < 2000 ms
  * error rate < 1 por ciento
  * disponibilidad = 100 por ciento (dev/QA puede variar)

---

## APIs principales

```
GET  /v1/health                         -> { status }
POST /v1/chat                           -> { text, usage }
POST /v1/agents/:id/run                 -> 202 + { correlationId }
GET  /v1/usage?tenant=:id               -> consumo por agente y tenant
GET  /v1/hitl/requests                  -> lista paginada
POST /v1/hitl/:id/approve|reject        -> decisión auditada
GET  /v1/dlp/events?tenant=:id          -> eventos DLP
```

Headers estándar: `Authorization: Bearer`, `X-Route`, `X-Correlation-Id`.

---

## Demo local en VS Code

```bash
corepack enable
pnpm -v || npm i -g pnpm@8.15.5
pnpm -w install --frozen-lockfile
pnpm -C apps/web dev
# VS Code → View: Simple Browser → http://localhost:3000
```

### Configuración rápida

* **AI_ENDPOINT**: apunta a tu proxy de servidor para IA.
* **Modelo**: define el modelo por defecto en la API.
* **Secrets**: nunca en el cliente; usa variables de entorno del servidor.

---

## Calidad y CI/CD

* **Coverage consolidado**: statements ≥ 90 por ciento, functions ≥ 80 por ciento.
* **Lint** sin warnings, **typecheck** estricto, artefactos reproducibles.
* **E2E** crítico con Playwright. **UI p95 < 2 s**.
* **Workflows**:

  * `ci.yml`: lint + build + test + coverage + artefactos.
  * `deploy.yml`: despliegue a Azure App Service.
  * `release.yml`: versionado y changelog automatizado.

Comandos útiles:

```bash
pnpm -C apps/web lint --max-warnings 0
pnpm -C apps/web typecheck
pnpm -C apps/web test:coverage
pnpm -C apps/api test:coverage
```

---

## Seguridad y cumplimiento UE

* Datos en la UE. TLS 1.2 o superior. Cifrado en tránsito y en reposo.
* Minimización de datos y RLS por tenant.
* Auditoría de accesos a PII y de decisiones HITL.
* Evaluaciones periódicas de riesgo y export de evidencias.
* Sin secretos en el cliente. Proxy seguro del lado servidor.

---

## ICP y casos de uso

**ICP**: organizaciones UE con ERP/CRM/HRIS consolidados, varias fuentes de datos y requisitos de cumplimiento.
**Casos**:

* CEO/COO: torre de control, SLA, OKR.
* CISO/CTO: vulnerabilidades, observabilidad, CI/CD seguro.
* CFO: tesorería, desviaciones, cobros.
* CDO: calidad, linaje, catálogo.
* CGO/Comercial: pipeline, campañas, post-campaña.

---

## Diferenciadores

* Gobierno de extremo a extremo desde el primer día.
* Métricas operativas y FinOps nativos.
* Integraciones Make/Azure y opción on-prem para modelos.
* Sin lock-in. Diseñado para coexistir con tu stack.

---

## Roadmap (resumen)

* Integraciones Make y Azure listas para producción.
* Cuotas y alertas FinOps runtime por agente.
* MSAL y RBAC por rol y área.
* Dashboards OTel y documentación de SLO.
* Benchmarks por sector en EUR por tarea p95 y calidad.

---

## Contribución

* Ramas: `feat/*`, `fix/*`, `chore/*`.
* PR con: cambios, riesgos HITL/FinOps, capturas, cobertura y p95.
* Estilo: ESLint y Prettier, commits convencionales, cero warnings.

---

## Preguntas frecuentes

**¿Sustituye mi ERP o CRM?** No. Orquestamos IA **sobre** tu stack.
**¿Dónde se procesan los datos?** En la UE, según despliegue acordado.
**¿Qué modelos usa?** Cloud u on-prem, sin lock-in de proveedor.
**¿Cómo controlo costes?** Límites por agente y tenant, **EUR por tarea p95** y alertas.

---

## Licencia

 Apache 2.0 o Business Source con anexo de uso responsable.


