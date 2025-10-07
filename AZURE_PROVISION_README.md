# Provisión Azure — Fase D y Fase E (publish-profiles → secretos)

Resumen
-------
Este repositorio incluye un workflow de GitHub Actions (`.github/workflows/azure-provision.yml`) pensado para ejecutar la Fase D (provisión idempotente en Azure) y dejar los publish-profiles como artefactos.

Requisitos previos
------------------
- `az` (Azure CLI) instalado y autenticado localmente si vas a ejecutar comandos localmente.
- `gh` (GitHub CLI) si quieres subir secretos automáticamente.

1) Crear un Service Principal (local)
-----------------------------------
Ejecuta localmente (requiere `az` y permisos suficientes):

```bash
# Reemplaza <SUBSCRIPTION_ID> por tu id de suscripción
az ad sp create-for-rbac --name "econeura-gh-actions-sp" --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID> --sdk-auth
```

Ese comando imprime un JSON con las credenciales. Guárdalo de forma segura.

2) Subir el secreto `AZURE_CREDENTIALS` al repositorio (opcional con `gh`)
-----------------------------------------------------------------------
Si tienes `gh` autenticado puedes subir el secret directamente:

```bash
# desde la carpeta del repo, y reemplaza '<JSON_DEL_SP>' por el JSON obtenido
gh secret set AZURE_CREDENTIALS --body '<JSON_DEL_SP>'
```

3) Ejecutar el workflow de provisión (Fase D)
---------------------------------------------
Desde la UI de Actions selecciona `azure-provision.yml` y pulsa "Run workflow".
Alternativamente, desde la CLI:

```bash
gh workflow run azure-provision.yml -f subscription_id=<SUBSCRIPTION_ID> -f resource_group=appsvc_linux_northeurope_basic
```

4) Publicar publish-profiles (Fase E)
-------------------------------------
El workflow sube `publish_profile_web.xml` y `publish_profile_api.xml` como artefactos. Descárgalos y súbelos como secretos del repositorio (nombres sugeridos):

- `AZURE_WEBAPP_PUBLISH_PROFILE_WEB`
- `AZURE_WEBAPP_PUBLISH_PROFILE_API`

Puedes subirlos con `gh`:

```bash
gh secret set AZURE_WEBAPP_PUBLISH_PROFILE_WEB --body "$(cat publish_profile_web.xml)"
gh secret set AZURE_WEBAPP_PUBLISH_PROFILE_API --body "$(cat publish_profile_api.xml)"
```

Notas
-----
- Asegúrate de que los nombres de WebApp en los workflows coinciden con los que quieres crear. La provisión es idempotente por nombre dentro de la misma suscripción.
- Los workflows incluyen comprobaciones "fail early" para evitar despliegues silenciosos si faltan secrets o archivos `dist`.

*** Fin
 
# ci-trigger: force Azure provision dispatch (auto)
