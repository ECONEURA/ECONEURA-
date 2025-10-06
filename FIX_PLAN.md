# Plan de corrección (FIX_PLAN) — ECONEURA Cockpit

Objetivo: pasos concretos, ordenados y verificables para resolver las causas
raíz listadas en `ROOT_CAUSE.json`.

1. Validar y (si falta) restaurar el publish profile en GitHub Actions

- Cómo verificar:
  - En GitHub → Settings → Secrets and variables → Actions → buscar
    `AZURE_WEBAPP_PUBLISH_PROFILE`.
  - Alternativa CLI (requiere permisos): usar gh CLI para ver valores de
    secretos (si la política lo permite).
- Si falta: generar nuevo publish profile desde Azure Portal (App Service → Get
  publish profile) y añadirlo como secret `AZURE_WEBAPP_PUBLISH_PROFILE`.
- Verificar ejecución: disparar la workflow
  `econeura-cockpit/.github/workflows/azure-webapp.yml` en rama de pruebas y
  revisar logs (autenticación exitosa y despliegue realizado).

2. Normalizar layout del artifact y el paso de empaquetado

- Problema: la action actual copia `server.js` a `dist/` con
  `node -e "fs.cpSync('server.js','dist/server.js')"` pero eso depende de que
  `dist/` exista y contenga todo lo necesario.
- Recomendación:
  - Modificar la workflow para construir explícitamente `apps/web` y
    `services/api` y crear un zip nombrado: `artifact/web-dist.zip` que contenga
    exactamente el layout esperado por `server.js`.
  - Asegurar que `server.js` (entrypoint) permanezca en la raíz del artifact o
    actualizar `server.js` para localizar assets relativos.
- Comprobación: al descomprimir `artifact/web-dist.zip` deberá existir
  `server.js` y las carpetas `node_modules` o `package.json`/`package-lock`
  según la estrategia de despliegue.

3. Asegurar versión de Node en App Service

- En Azure Portal: App Service → Configuration → General settings → Stack
  settings → elegir `Node 20 LTS` o establecer `WEBSITE_NODE_DEFAULT_VERSION` en
  app settings.
- Para IaC: si usan ARM/Bicep/Terraform, fijar `linuxFxVersion` a `NODE|20-lts`.

4. Confirmar puerto y health checks

- Asegurar que `server.js` usa `process.env.PORT || 3000` para escuchar.
- Habilitar una ruta `/healthz` que devuelva 200 para que App Service y probes
  internos puedan validar que la app está viva.

5. Añadir un workflow de verificación

- Implementar `.github/workflows/ci-smoke.yml` que haga lo siguiente:
  - Use Node 20, pnpm
  - Instale y construya `apps/web`
  - Empaquete `dist/` en `artifact/web-dist.zip`
  - Verifique que `server.js` y `package.json` estén presentes dentro del zip
  - Suba el artifact para inspección en caso de fallo

Verificación final y rollback

- Tras aplicar cambios, ejecutar la workflow `ci-smoke` en una rama de pruebas.
  Validar que la acción produce `artifact/web-dist.zip` y que contiene
  `server.js` y `package.json`.
- Desplegar a un slot de staging (si existe) antes de promover a producción. Si
  el despliegue produce errores, restaurar el publish profile anterior y revisar
  logs de npm/install.

Notas operativas

- Ejecuta los builds en el DevContainer recomendado por `README.dev.md` para
  evitar discrepancias de versiones.
- Mantener el `azure/webapps-deploy@v2` pero con input `publish-profile`
  verificado; considera usar `azure/login` + `az webapp deploy` con Service
  Principal para mayor trazabilidad.

Fin del plan.
