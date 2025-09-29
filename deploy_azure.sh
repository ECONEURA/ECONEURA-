#!/usr/bin/env bash
# ECONEURA · Deploy a Azure App Service (API + Web)
set -euo pipefail; IFS=$'\n\t'

# Configuración Azure
SUBSCRIPTION_ID="fc22ced4-6dc1-4f52-aac1-170a62f98c57"
RESOURCE_GROUP="appsvc_linux_northeurope_basic"
API_APP="econeura-api-dev"
WEB_APP="econeura-web-dev"
REGION="northeurope"

# Función para deploy
deploy_app() {
  local app_name="$1"
  local publish_profile="$2"
  local source_dir="$3"

  echo "🚀 Deploying $app_name to Azure..."

  # Usar Azure CLI para deploy
  az webapp deployment source config-zip \
    --resource-group "$RESOURCE_GROUP" \
    --name "$app_name" \
    --src "$source_dir" \
    --subscription "$SUBSCRIPTION_ID"

  echo "✅ $app_name deployed successfully"
}

# Verificar Azure CLI
if ! command -v az >/dev/null; then
  echo "❌ Azure CLI not installed. Install with: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash"
  exit 1
fi

# Login (asumir service principal o interactive)
if ! az account show >/dev/null 2>&1; then
  echo "🔐 Logging into Azure..."
  az login --use-device-code
fi

# Deploy API (Python)
if [ -d "apps/api_py" ]; then
  echo "📦 Preparing API deployment..."
  # Crear zip del API
  cd apps/api_py
  zip -r ../api_deploy.zip . -x "*.pyc" "__pycache__/*"
  cd ../..

  deploy_app "$API_APP" "$AZURE_API_PUBLISH_PROFILE" "apps/api_deploy.zip"
fi

# Deploy Web (si existe)
if [ -d "apps/web" ]; then
  echo "📦 Preparing Web deployment..."
  cd apps/web
  npm run build  # Asumir build
  zip -r ../web_deploy.zip dist/
  cd ../..

  deploy_app "$WEB_APP" "$AZURE_WEB_PUBLISH_PROFILE" "apps/web_deploy.zip"
fi

echo "🎉 All deployments completed!"
echo "🌐 API: https://$API_APP.azurewebsites.net"
echo "🌐 Web: https://$WEB_APP.azurewebsites.net"