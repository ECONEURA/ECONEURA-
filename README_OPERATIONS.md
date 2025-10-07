# 📋 **Guía de Operaciones y Mantenimiento - ECONEURA-**

## 🚀 **Despliegue y Configuración**

### **Despliegue Inicial**

```bash
# 1. Despliegue a Azure App Services
./deploy_azure.sh

# 2. Configurar Auto-Scaling
./auto_scale_azure.sh

# 3. Configurar Alertas
./alerts_azure.sh

# 4. Crear Dashboard
./dashboard_azure.sh
```

### **Despliegue en Kubernetes (Opcional)**

```bash
# Despliegue completo en AKS
./k8s_deploy.sh
```

## 🧪 **Testing y Validación**

### **Testing Básico**

```bash
# Health check
curl -f http://localhost:8080/health

# Test de neuras
for i in {1..10}; do
  curl -X POST http://localhost:8080/neura/$i \
    -H "Content-Type: application/json" \
    -d '{"data": "test"}'
done
```

### **Testing Avanzado**

```bash
# Testing completo (health, integration, performance, load)
./test_advanced.sh
```

## 📊 **Monitoreo y Alertas**

### **Monitoreo 24/7**

```bash
# Iniciar monitoreo continuo
./monitor_production.sh
```

### **Dashboard Ejecutivo**

- **URL**:
  https://portal.azure.com/#dashboard/arm/subscriptions/{subscription-id}/resourceGroups/ECONEURA-RG/providers/Microsoft.Portal/dashboards/ECONEURA-Dashboard
- **Métricas**: CPU, Memoria, HTTP Responses, Latencia, Solicitudes

### **Alertas Configuradas**

- **CPU > 80%**: Escalado automático
- **Memoria > 85%**: Notificación al equipo
- **HTTP 5xx > 10**: Alerta crítica
- **Latencia > 5s**: Alerta de rendimiento
- **HTTP 4xx > 50**: Alerta de errores
- **Health Check Failed**: Alerta inmediata

## 🔧 **Mantenimiento y Troubleshooting**

### **Logs de Aplicación**

```bash
# Ver logs en App Service
az webapp log tail --name ECONEURA-API --resource-group ECONEURA-RG

# Ver logs en Kubernetes
kubectl logs -n econeura deployment/ECONEURA-API
```

### **Reinicio de Servicios**

```bash
# Reiniciar App Service
az webapp restart --name ECONEURA-API --resource-group ECONEURA-RG

# Reiniciar pods en K8s
kubectl rollout restart deployment/ECONEURA-API -n econeura
```

### **Backup y Recovery**

```bash
# Backup de configuración
az webapp config backup create \
  --resource-group ECONEURA-RG \
  --webapp-name ECONEURA-API \
  --backup-name "backup-$(date +%Y%m%d)"

# Restaurar backup
az webapp config backup restore \
  --resource-group ECONEURA-RG \
  --webapp-name ECONEURA-API \
  --backup-name "backup-name"
```

## 📈 **Escalado y Performance**

### **Auto-Scaling Rules**

- **Mínimo**: 1 instancia
- **Máximo**: 10 instancias
- **CPU Threshold**: >70% (escala arriba), <30% (escala abajo)
- **Memoria Threshold**: >80% (escala arriba)

### **Optimización de Performance**

```bash
# Ver métricas de performance
az monitor metrics list \
  --resource /subscriptions/{sub-id}/resourceGroups/ECONEURA-RG/providers/Microsoft.Web/sites/ECONEURA-API \
  --metric "HttpResponseTime,Requests"

# Ajustar configuración de App Service
az webapp config set \
  --name ECONEURA-API \
  --resource-group ECONEURA-RG \
  --always-on true \
  --use-32bit-worker-process false
```

## 🚨 **Respuesta a Incidentes**

### **Protocolo de Alerta**

1. **Recibir alerta** por email/SMS
2. **Verificar dashboard** ejecutivo
3. **Revisar logs** de aplicación
4. **Escalar manualmente** si es necesario
5. **Comunicar** al equipo de desarrollo
6. **Documentar** incidente y resolución

### **Escalado Manual**

```bash
# Escalar App Service Plan
az appservice plan update \
  --name ECONEURA-API-Plan \
  --resource-group ECONEURA-RG \
  --number-of-workers 5
```

## 👥 **Equipo de Soporte**

### **Roles y Responsabilidades**

- **DevOps Lead**: Despliegues y infraestructura
- **Backend Developer**: API y lógica de negocio
- **QA Engineer**: Testing y validación
- **Product Owner**: Requisitos y prioridades

### **Contactos de Emergencia**

- **DevOps On-Call**: devops@econeura.com
- **Backend On-Call**: backend@econeura.com
- **Soporte General**: support@econeura.com

### **Horarios de Cobertura**

- **Diurno**: 9:00 - 18:00 CET (L-V)
- **Nocturno**: 18:00 - 9:00 CET (Rotativo semanal)
- **Fines de semana**: Soporte limitado

## 📚 **Recursos Adicionales**

### **Documentación Técnica**

- [Azure App Services](https://docs.microsoft.com/azure/app-service/)
- [Azure Monitor](https://docs.microsoft.com/azure/azure-monitor/)
- [Kubernetes en Azure](https://docs.microsoft.com/azure/aks/)

### **Herramientas de Desarrollo**

- **CI/CD**: GitHub Actions
- **Testing**: Scripts bash + k6
- **Monitoreo**: Azure Monitor + Dashboards
- **Infraestructura**: Azure CLI + Terraform

---

## 🎯 **Métricas de Éxito F6**

- ✅ **Disponibilidad**: 99.9% uptime
- ✅ **Performance**: <500ms response time
- ✅ **Escalabilidad**: Auto-scaling funcional
- ✅ **Monitoreo**: Alertas y dashboards operativos
- ✅ **Documentación**: Guías completas de operación

**Estado Actual**: 🟢 **PRODUCCIÓN ACTIVA**
