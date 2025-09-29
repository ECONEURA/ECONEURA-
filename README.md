# ECONEURA — Control plane de IA  
**Gestiona IA sobre tu stack. No sustituimos ERP/CRM.**

## Resumen
Operamos IA en empresas existentes sin cambiar ERP/CRM/HRIS. Unificamos **agentes + gobierno**: HITL, DLP, FinOps y evidencias. Objetivo: **valor repetible**, costes previsibles y cumplimiento UE.

## Tesis
- La IA aporta ROI solo con control operativo.  
- Las compañías necesitan gobernar, no migrar.  
- Medir €/tarea y p95 reduce riesgo financiero.

## Problema
- Pilotos aislados, sin métricas ni compliance.  
- Shadow AI y exposición de PII.  
- Costes difusos por proveedor/modelo.

## Propuesta de valor
- Cockpit 1:1 con **10 NEURA** conectables a tu stack.  
- Gobierno integrado: **HITL, DLP, FinOps, evidencias**.  
- Tiempo a valor **< 7 días** con proxy seguro.  
- Sin sustituir sistemas existentes.

## Producto (MVP)
- **Cockpit web** con inicio de sesión simulado; actividad por NEURA.  
- **API** `GET /api/health`, `POST /api/invoke/:id` (headers: Bearer, X-Route, X-Correlation-Id).  
- **Routing** declarativo `packages/config/agent-routing.json` (10 filas).  
- **NO_DEPLOY** forzado en CI. Cliente sin secretos.

## Tracción técnica inicial
- 10/10 invocaciones 200 en smoke.  
- CI verde con logs y retry de puertos.  
- Artefactos reproducibles.

## Mercado e ICP
- Mid-market y enterprise UE.  
- Compradores: CEO/COO/CTO/CIO.  
- ICP: organizaciones con datos en UE y múltiples sistemas core.

## Casos de uso (NEURA)
- CEO/COO: OKR, torre de control, SLA.  
- CISO/CTO: vulnerabilidades, CI/CD, observabilidad.  
- CFO: tesorería, variance, cobros.  
- CDO: calidad, linaje, catálogo.  
- MKT/Ventas: embudo, pipeline, post-campaña.

## GTM
- Pilotos **6–8 semanas** (“land & expand”).  
- Partners SI y canales cloud.  
- Enfoque compliance UE y sectores regulados.

## Modelo de ingresos
- Suscripción por área + paquete de NEURA.  
- Variable por uso (**€/tarea p95**).  
- Add-ons: cumplimiento y soporte avanzado.

## Moat
- “Sobre tu stack” con gobierno real de extremo a extremo.  
- Métricas operativas y FinOps nativos.  
- HITL y DLP desde el día 0.

## KPIs
- **TTV < 7 días**  
- **€/tarea p95**  
- **%HITL**  
- **DLP hits**  
- **10/10 invocaciones**  
- **NPS**

## Roadmap 12 meses
1. Integraciones Make/Azure; timeouts y retrías.  
2. Métricas de coste por tarea y cuotas.  
3. MSAL y RBAC.  
4. Hardening, duplicados ≤4%, gitleaks HIGH=0.  
5. Certificaciones y auditoría ampliada.

## Riesgos y mitigación
- Integración: pilotos guiados, contratos de test.  
- Seguridad: datos en UE, minimización, DLP.  
- Proveedores IA: multivendor y fallbacks.

## Uso de fondos (orientativo)
- Integraciones core y seguridad.  
- Métricas/FinOps y certificaciones.  
- GTM con partners.

## Estado actual
- **MVP operativo** con smoke CI.  
- **NO_DEPLOY** activo hasta pilotos.

---

### Anexo técnico breve
- Web: Vite/React; token simulado `window.__ECONEURA_BEARER`.  
- API dev: Python stdlib `apps/api_py/server.py`.  
- CI: `ci.yml` con job único `smoke_python` (Python 3.11, logs, retry).  
- Rutas mínimas: ver “Producto (MVP)”.

> Copy oficial: **“Gestiona IA sobre tu stack. No sustituimos ERP/CRM”.**
