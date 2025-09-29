#!/bin/bash

# alerts_azure.sh - Configuración de Alertas Avanzadas para ECONEURA-
# Fase F6: Producción y Escalado

set -e

# Configuración
RESOURCE_GROUP="ECONEURA-RG"
APP_NAME="ECONEURA-API"
ALERT_EMAIL="alerts@econeura.com"

echo "🚨 Configurando Alertas Avanzadas para $APP_NAME..."

# Verificar login de Azure
if ! az account show > /dev/null 2>&1; then
    echo "❌ No estás logueado en Azure. Ejecuta: az login"
    exit 1
fi

# Crear Action Group para notificaciones
echo "📧 Creando Action Group para alertas..."
az monitor action-group create \
    --name "ECONEURA-Alerts" \
    --resource-group "$RESOURCE_GROUP" \
    --action email ECONEURA-Team "$ALERT_EMAIL" \
    --short-name "ECON-ALERT"

# Alerta de CPU Alta
echo "🔥 Configurando alerta de CPU Alta..."
az monitor metrics alert create \
    --name "High-CPU-Alert" \
    --resource-group "$RESOURCE_GROUP" \
    --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_NAME" \
    --action "ECONEURA-Alerts" \
    --condition "avg Percentage CPU > 80" \
    --description "CPU usage is above 80%" \
    --evaluation-frequency 5m \
    --window-size 15m \
    --severity 2

# Alerta de Memoria Alta
echo "💾 Configurando alerta de Memoria Alta..."
az monitor metrics alert create \
    --name "High-Memory-Alert" \
    --resource-group "$RESOURCE_GROUP" \
    --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_NAME" \
    --action "ECONEURA-Alerts" \
    --condition "avg Percentage Memory > 85" \
    --description "Memory usage is above 85%" \
    --evaluation-frequency 5m \
    --window-size 15m \
    --severity 2

# Alerta de Errores HTTP 5xx
echo "❌ Configurando alerta de Errores HTTP..."
az monitor metrics alert create \
    --name "HTTP-5xx-Errors-Alert" \
    --resource-group "$RESOURCE_GROUP" \
    --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_NAME" \
    --action "ECONEURA-Alerts" \
    --condition "total Http5xx > 10" \
    --description "HTTP 5xx errors exceeded threshold" \
    --evaluation-frequency 5m \
    --window-size 15m \
    --severity 1

# Alerta de Latencia Alta
echo "⏱️ Configurando alerta de Latencia Alta..."
az monitor metrics alert create \
    --name "High-Latency-Alert" \
    --resource-group "$RESOURCE_GROUP" \
    --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_NAME" \
    --action "ECONEURA-Alerts" \
    --condition "avg HttpResponseTime > 5000" \
    --description "Average response time is above 5 seconds" \
    --evaluation-frequency 5m \
    --window-size 15m \
    --severity 2

# Alerta de Solicitudes Fallidas
echo "🔴 Configurando alerta de Solicitudes Fallidas..."
az monitor metrics alert create \
    --name "Failed-Requests-Alert" \
    --resource-group "$RESOURCE_GROUP" \
    --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_NAME" \
    --action "ECONEURA-Alerts" \
    --condition "total Http4xx > 50" \
    --description "HTTP 4xx errors exceeded threshold" \
    --evaluation-frequency 5m \
    --window-size 15m \
    --severity 3

# Alerta de Health Check Fallido
echo "🏥 Configurando alerta de Health Check..."
az monitor metrics alert create \
    --name "Health-Check-Failed" \
    --resource-group "$RESOURCE_GROUP" \
    --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_NAME" \
    --action "ECONEURA-Alerts" \
    --condition "avg HealthCheckStatus < 1" \
    --description "Health check is failing" \
    --evaluation-frequency 1m \
    --window-size 5m \
    --severity 1

echo "✅ Alertas avanzadas configuradas exitosamente!"
echo "📧 Notificaciones enviadas a: $ALERT_EMAIL"
echo "📊 Alertas configuradas:"
echo "   - CPU > 80%"
echo "   - Memoria > 85%"
echo "   - HTTP 5xx > 10"
echo "   - Latencia > 5s"
echo "   - HTTP 4xx > 50"
echo "   - Health Check fallido"

# Listar alertas configuradas
echo "🔍 Listando alertas activas..."
az monitor metrics alert list \
    --resource-group "$RESOURCE_GROUP" \
    --query "[].{name:name, severity:severity, enabled:enabled}" \
    -o table