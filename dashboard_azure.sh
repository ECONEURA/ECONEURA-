#!/bin/bash

# dashboard_azure.sh - Configuración de Dashboards para ECONEURA-
# Fase F6: Producción y Escalado

set -e

# Configuración
RESOURCE_GROUP="ECONEURA-RG"
APP_NAME="ECONEURA-API"
LOCATION="northeurope"
DASHBOARD_NAME="ECONEURA-Dashboard"

echo "📊 Creando Dashboard Ejecutivo para $APP_NAME..."

# Verificar login de Azure
if ! az account show > /dev/null 2>&1; then
    echo "❌ No estás logueado en Azure. Ejecuta: az login"
    exit 1
fi

# Crear dashboard JSON
cat > dashboard-template.json << EOF
{
  "properties": {
    "lenses": {
      "0": {
        "order": 0,
        "parts": {
          "0": {
            "position": {
              "x": 0,
              "y": 0,
              "colSpan": 6,
              "rowSpan": 4
            },
            "metadata": {
              "inputs": [
                {
                  "name": "resourceTypeMode",
                  "value": "microsoft.web/sites"
                },
                {
                  "name": "ComponentId",
                  "value": "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_NAME"
                }
              ],
              "type": "Extension/HubsExtension/PartType/MonitorChartPart",
              "settings": {
                "content": {
                  "options": {
                    "chart": {
                      "metrics": [
                        {
                          "resourceMetadata": {
                            "id": "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_NAME"
                          },
                          "name": "CpuPercentage",
                          "aggregationType": 4,
                          "namespace": "microsoft.web/sites"
                        },
                        {
                          "resourceMetadata": {
                            "id": "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_NAME"
                          },
                          "name": "MemoryPercentage",
                          "aggregationType": 4,
                          "namespace": "microsoft.web/sites"
                        }
                      ],
                      "title": "CPU y Memoria - Últimas 24 horas",
                      "titleKind": 2,
                      "visualization": {
                        "chartType": 2,
                        "legend": {
                          "isVisible": true,
                          "position": 2
                        },
                        "axis": {
                          "x": {
                            "isVisible": true,
                            "axisType": 2
                          },
                          "y": {
                            "isVisible": true,
                            "axisType": 1
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "1": {
            "position": {
              "x": 6,
              "y": 0,
              "colSpan": 6,
              "rowSpan": 4
            },
            "metadata": {
              "inputs": [
                {
                  "name": "resourceTypeMode",
                  "value": "microsoft.web/sites"
                },
                {
                  "name": "ComponentId",
                  "value": "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_NAME"
                }
              ],
              "type": "Extension/HubsExtension/PartType/MonitorChartPart",
              "settings": {
                "content": {
                  "options": {
                    "chart": {
                      "metrics": [
                        {
                          "resourceMetadata": {
                            "id": "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_NAME"
                          },
                          "name": "Http2xx",
                          "aggregationType": 1,
                          "namespace": "microsoft.web/sites"
                        },
                        {
                          "resourceMetadata": {
                            "id": "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_NAME"
                          },
                          "name": "Http4xx",
                          "aggregationType": 1,
                          "namespace": "microsoft.web/sites"
                        },
                        {
                          "resourceMetadata": {
                            "id": "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_NAME"
                          },
                          "name": "Http5xx",
                          "aggregationType": 1,
                          "namespace": "microsoft.web/sites"
                        }
                      ],
                      "title": "Respuestas HTTP - Últimas 24 horas",
                      "titleKind": 2,
                      "visualization": {
                        "chartType": 1,
                        "legend": {
                          "isVisible": true,
                          "position": 2
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "2": {
            "position": {
              "x": 0,
              "y": 4,
              "colSpan": 6,
              "rowSpan": 4
            },
            "metadata": {
              "inputs": [
                {
                  "name": "resourceTypeMode",
                  "value": "microsoft.web/sites"
                },
                {
                  "name": "ComponentId",
                  "value": "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_NAME"
                }
              ],
              "type": "Extension/HubsExtension/PartType/MonitorChartPart",
              "settings": {
                "content": {
                  "options": {
                    "chart": {
                      "metrics": [
                        {
                          "resourceMetadata": {
                            "id": "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_NAME"
                          },
                          "name": "AverageResponseTime",
                          "aggregationType": 4,
                          "namespace": "microsoft.web/sites"
                        }
                      ],
                      "title": "Tiempo de Respuesta Promedio (ms)",
                      "titleKind": 2,
                      "visualization": {
                        "chartType": 2,
                        "legend": {
                          "isVisible": true,
                          "position": 2
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "3": {
            "position": {
              "x": 6,
              "y": 4,
              "colSpan": 6,
              "rowSpan": 4
            },
            "metadata": {
              "inputs": [
                {
                  "name": "resourceTypeMode",
                  "value": "microsoft.web/sites"
                },
                {
                  "name": "ComponentId",
                  "value": "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_NAME"
                }
              ],
              "type": "Extension/HubsExtension/PartType/MonitorChartPart",
              "settings": {
                "content": {
                  "options": {
                    "chart": {
                      "metrics": [
                        {
                          "resourceMetadata": {
                            "id": "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_NAME"
                          },
                          "name": "Requests",
                          "aggregationType": 1,
                          "namespace": "microsoft.web/sites"
                        }
                      ],
                      "title": "Total de Solicitudes - Últimas 24 horas",
                      "titleKind": 2,
                      "visualization": {
                        "chartType": 3,
                        "legend": {
                          "isVisible": true,
                          "position": 2
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "metadata": {
      "model": {
        "timeRange": {
          "value": {
            "relative": {
              "duration": 24,
              "timeUnit": 1
            }
          },
          "type": "MsPortalFx.Composition.Configuration.ValueTypes.TimeRange"
        }
      }
    }
  },
  "name": "$DASHBOARD_NAME",
  "type": "Microsoft.Portal/dashboards",
  "location": "$LOCATION",
  "tags": {
    "project": "ECONEURA",
    "environment": "production"
  }
}
EOF

# Crear el dashboard
echo "📈 Creando dashboard en Azure Portal..."
az portal dashboard create \
    --name "$DASHBOARD_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --input-path dashboard-template.json

# Limpiar archivo temporal
rm dashboard-template.json

echo "✅ Dashboard ejecutivo creado exitosamente!"
echo "📊 Dashboard disponible en: https://portal.azure.com/#dashboard/arm/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Portal/dashboards/$DASHBOARD_NAME"
echo "📈 Métricas incluidas:"
echo "   - CPU y Memoria en tiempo real"
echo "   - Respuestas HTTP (2xx, 4xx, 5xx)"
echo "   - Tiempo de respuesta promedio"
echo "   - Total de solicitudes"

# Mostrar URL del dashboard
DASHBOARD_URL="https://portal.azure.com/#dashboard/arm/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Portal/dashboards/$DASHBOARD_NAME"
echo "🔗 URL del Dashboard: $DASHBOARD_URL"