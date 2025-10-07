# 🚀 Provisión Azure — Automatizada (Fases D + E)

## Resumen

Este repositorio incluye un workflow automatizado de GitHub Actions (`.github/workflows/azure-provision.yml`) que ejecuta:
- **Fase D**: Provisión idempotente en Azure (Resource Group, App Service Plan, WebApps)
- **Fase E**: Publicación automática de publish-profiles como secretos de GitHub

Todo en un solo workflow, sin necesidad de pasos manuales intermedios.

---

## ⚡ Inicio Rápido (3 pasos)

### 1️⃣ Crear Service Principal y subir credenciales

Ejecuta localmente (requiere `az` y `gh` CLI autenticados):

```bash
# Establece tu subscription ID
SUBSCRIPTION_ID="fc22ced4-6dc1-4f52-aac1-170a62f98c57"

# Crea Service Principal con permisos de Contributor
az ad sp create-for-rbac \
  --name "econeura-gh-actions-sp" \
  --role contributor \
  --scopes "/subscriptions/$SUBSCRIPTION_ID" \
  --sdk-auth > sp.json

# Sube las credenciales como secreto AZURE_CREDENTIALS
gh secret set AZURE_CREDENTIALS --body "$(cat sp.json)"

# Limpia el archivo temporal
rm sp.json
```

**Alternativa con script helper:**
```bash
./scripts/create-sp-and-secrets.sh fc22ced4-6dc1-4f52-aac1-170a62f98c57 appsvc_linux_northeurope_basic
```

### 2️⃣ Ejecutar el workflow de provisión

**Opción A - Desde GitHub UI:**
1. Ve a Actions → `Azure Provision (Automated)`
2. Click en "Run workflow"
3. Deja los valores por defecto (o personalízalos)
4. Click "Run workflow"

**Opción B - Desde CLI:**
```bash
gh workflow run azure-provision.yml \
  -f subscription_id=fc22ced4-6dc1-4f52-aac1-170a62f98c57 \
  -f resource_group=appsvc_linux_northeurope_basic \
  -f webapp=econeura-web-dev \
  -f apiapp=econeura-api-dev \
  -f upload_secrets=true
```

### 3️⃣ Verificar y desplegar

```bash
# Verifica que los secretos se crearon correctamente
gh secret list | grep AZURE_WEBAPP_PUBLISH_PROFILE

# Despliega la aplicación web
gh workflow run deploy-web.yml

# Despliega la API
gh workflow run deploy-api.yml
```

---

## 📋 Requisitos Previos

### Local (para crear Service Principal)
- **Azure CLI** (`az`) instalado y autenticado: https://learn.microsoft.com/cli/azure/install-azure-cli
- **GitHub CLI** (`gh`) instalado y autenticado: https://cli.github.com/
- Permisos de **Contributor** o superior en la suscripción de Azure

### GitHub (secrets necesarios)
- `AZURE_CREDENTIALS` - Credenciales del Service Principal (se crea en el paso 1)

---

## 🔧 ¿Qué hace el workflow automáticamente?

### Fase D - Provisión Idempotente
1. ✅ Crea/verifica Resource Group
2. ✅ Crea/verifica App Service Plan (B1, Linux)
3. ✅ Crea/verifica Web App (frontend) con Node 20
4. ✅ Crea/verifica Web App (API) con Node 20
5. ✅ Configura App Settings (CORS, endpoints, ports)
6. ✅ Descarga publish profiles

### Fase E - Publicación de Secretos
7. ✅ Sube publish profiles como artefactos del workflow
8. ✅ Sube publish profiles como secretos de GitHub:
   - `AZURE_WEBAPP_PUBLISH_PROFILE_WEB`
   - `AZURE_WEBAPP_PUBLISH_PROFILE_API`

### Outputs
- **Artefactos**: `publish_profile_web.xml`, `publish_profile_api.xml` (7 días de retención)
- **Secretos**: Configurados automáticamente en el repositorio
- **Summary**: Resumen detallado con URLs y próximos pasos

---

## 🛠️ Configuración Avanzada

### Parámetros del Workflow

| Parámetro | Default | Descripción |
|-----------|---------|-------------|
| `subscription_id` | `fc22ced4-6dc1-4f52-aac1-170a62f98c57` | ID de suscripción Azure |
| `resource_group` | `appsvc_linux_northeurope_basic` | Nombre del Resource Group |
| `location` | `northeurope` | Región de Azure |
| `plan` | `appsvc_linux_northeurope_basic` | Nombre del App Service Plan |
| `webapp` | `econeura-web-dev` | Nombre de la WebApp (frontend) |
| `apiapp` | `econeura-api-dev` | Nombre de la WebApp (API) |
| `node_fx` | `NODE\|20-lts` | Runtime de Node.js |
| `port` | `3000` | Puerto de la aplicación |
| `upload_secrets` | `true` | Subir publish profiles como secretos |

### Permisos del Token

Para que el upload automático de secretos funcione, el `GITHUB_TOKEN` necesita permisos de escritura en secretos. Si falla, el workflow:
1. Seguirá funcionando y subiendo artefactos
2. Mostrará instrucciones para subir manualmente con `gh secret set`

**Solución alternativa**: Crear un Personal Access Token (PAT) con scope `repo` y agregarlo como secreto `GH_PAT`.

---

## 📦 Scripts Helper Incluidos

### `scripts/create-sp-and-secrets.sh`
Automatiza la creación del Service Principal y upload de secretos:
```bash
./scripts/create-sp-and-secrets.sh <SUBSCRIPTION_ID> <RESOURCE_GROUP>
```

### `scripts/upload-publish-profiles-to-gh.sh`
Para subir manualmente los publish profiles descargados:
```bash
# Descarga los artefactos del workflow y colócalos en la raíz
./scripts/upload-publish-profiles-to-gh.sh
```

---

## ✅ Verificación Post-Provisión

```bash
# 1. Verifica recursos en Azure
az webapp list --resource-group appsvc_linux_northeurope_basic -o table

# 2. Verifica secretos en GitHub
gh secret list

# 3. Prueba los endpoints
curl -I https://econeura-web-dev.azurewebsites.net
curl -I https://econeura-api-dev.azurewebsites.net/api/health

# 4. Revisa los workflows de deploy
gh workflow view deploy-web.yml
gh workflow view deploy-api.yml
```

---

## 🔍 Troubleshooting

### Error: "Missing secret AZURE_CREDENTIALS"
```bash
# Verifica que el secreto existe
gh secret list | grep AZURE_CREDENTIALS

# Si no existe, créalo siguiendo el paso 1️⃣
```

### Error: "gh CLI no autenticado"
```bash
# Autentica gh CLI
gh auth login

# Verifica autenticación
gh auth status
```

### Error: "Permisos insuficientes para subir secretos"
El `GITHUB_TOKEN` por defecto puede no tener permisos suficientes. Opciones:
1. Descarga los artefactos y usa `./scripts/upload-publish-profiles-to-gh.sh`
2. Crea un PAT con scope `repo` y configúralo como secret `GH_PAT`

### Los recursos ya existen
✅ Normal. El workflow es **idempotente** - verifica y actualiza recursos existentes sin errores.

---

## 🎯 Criterios de Éxito

- ✅ Resource Group existe y está en la región correcta
- ✅ App Service Plan está en tier B1 y es Linux
- ✅ WebApps están corriendo y responden en sus URLs
- ✅ Secretos `AZURE_WEBAPP_PUBLISH_PROFILE_*` están configurados
- ✅ Workflows de deploy pueden ejecutarse sin errores
- ✅ Endpoints responden con HTTP 200 o redirección válida

---

## 📚 Recursos Adicionales

- [Azure App Service Documentation](https://learn.microsoft.com/azure/app-service/)
- [GitHub Actions for Azure](https://github.com/Azure/actions)
- [Azure CLI Reference](https://learn.microsoft.com/cli/azure/)

---

**⚡ Tiempo estimado total: 5-10 minutos** (dependiendo de la creación de recursos en Azure)
