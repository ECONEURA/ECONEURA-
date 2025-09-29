#!/bin/bash

# auto_scale_azure.sh - Configuración de Auto-Scaling para ECONEURA-
# Fase F6: Producción y Escalado

set -e

# Configuración
RESOURCE_GROUP="ECONEURA-RG"
APP_NAME="ECONEURA-API"
LOCATION="northeurope"
MIN_INSTANCES=1
MAX_INSTANCES=10
CPU_THRESHOLD=70
MEMORY_THRESHOLD=80

echo "🚀 Configurando Auto-Scaling para $APP_NAME..."

# Verificar login de Azure
if ! az account show > /dev/null 2>&1; then
    echo "❌ No estás logueado en Azure. Ejecuta: az login"
    exit 1
fi

# Crear plan de App Service si no existe
echo "📦 Verificando App Service Plan..."
if ! az appservice plan show --name "$APP_NAME-Plan" --resource-group "$RESOURCE_GROUP" > /dev/null 2>&1; then
    echo "Creando App Service Plan con auto-scaling..."
    az appservice plan create \
        --name "$APP_NAME-Plan" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --sku P1V2 \
        --number-of-workers $MIN_INSTANCES \
        --is-linux
fi

# Configurar Auto-Scaling
echo "⚖️ Configurando reglas de auto-scaling..."

# Regla de escalado basado en CPU
az monitor autoscale create \
    --resource "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/serverfarms/$APP_NAME-Plan" \
    --name "$APP_NAME-AutoScale" \
    --min-count $MIN_INSTANCES \
    --max-count $MAX_INSTANCES \
    --count $MIN_INSTANCES

# Regla de escalado hacia arriba (CPU > 70%)
az monitor autoscale rule create \
    --autoscale-name "$APP_NAME-AutoScale" \
    --resource-group "$RESOURCE_GROUP" \
    --condition "Percentage CPU > $CPU_THRESHOLD avg 5m" \
    --scale out 2 \
    --cooldown 5

# Regla de escalado hacia abajo (CPU < 30%)
az monitor autoscale rule create \
    --autoscale-name "$APP_NAME-AutoScale" \
    --resource-group "$RESOURCE_GROUP" \
    --condition "Percentage CPU < 30 avg 10m" \
    --scale in 1 \
    --cooldown 10

# Regla de memoria (opcional)
az monitor autoscale rule create \
    --autoscale-name "$APP_NAME-AutoScale" \
    --resource-group "$RESOURCE_GROUP" \
    --condition "Percentage Memory > $MEMORY_THRESHOLD avg 5m" \
    --scale out 1 \
    --cooldown 5

echo "✅ Auto-Scaling configurado exitosamente!"
echo "📊 Métricas configuradas:"
echo "   - CPU Threshold: $CPU_THRESHOLD%"
echo "   - Memory Threshold: $MEMORY_THRESHOLD%"
echo "   - Min Instances: $MIN_INSTANCES"
echo "   - Max Instances: $MAX_INSTANCES"

# Verificar configuración
echo "🔍 Verificando configuración..."
az monitor autoscale show \
    --name "$APP_NAME-AutoScale" \
    --resource-group "$RESOURCE_GROUP" \
    --query "{name:name, enabled:enabled, profiles:profiles[0].rules}" \
    -o table