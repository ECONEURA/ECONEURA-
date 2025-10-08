# Observability para ECONEURA

Utilidades compartidas de OpenTelemetry para todos los servicios ECONEURA.

## Setup en un microservicio

```python
from observability.otlp_utils import setup_observability, instrument_fastapi_app

# 1. Configurar al inicio del servicio
tracer, meter = setup_observability("neura-analytics", "1.0.0")

# 2. Instrumentar FastAPI
app = FastAPI()
instrument_fastapi_app(app, "neura-analytics")

# 3. Usar en endpoints
@app.post("/invoke")
async def invoke(request: InvokeRequest):
    with tracer.start_as_current_span("process_invocation") as span:
        span.set_attribute("agent.area", "analytics")
        span.set_attribute("query", request.query)
        
        # Tu lógica aquí
        result = process_analytics(request)
        
        span.set_attribute("result.size", len(result))
        return result
```

## Decorador @traced

```python
from observability.otlp_utils import traced

@traced("fetch_data_from_db")
async def fetch_data(query: str):
    # Esta función será automáticamente trackeada
    return await db.execute(query)
```

## Métricas personalizadas

```python
# Crear métricas
invocations_counter = meter.create_counter(
    "invocations_total",
    description="Total de invocaciones"
)

duration_histogram = meter.create_histogram(
    "invocation_duration_seconds",
    description="Duración de invocaciones"
)

# Usar métricas
invocations_counter.add(1, {"agent": "analytics", "status": "success"})
duration_histogram.record(0.250, {"agent": "analytics"})
```

## Variables de Entorno

```bash
# Endpoint de OTLP (Jaeger, Grafana Cloud, etc)
OTLP_ENDPOINT=http://localhost:4317

# Entorno
ENV=dev  # o 'prod'
```

## Stack de Observabilidad

### Opción 1: Jaeger (desarrollo local)
```yaml
# docker-compose.dev.yml
services:
  jaeger:
    image: jaegertracing/all-in-one:1.60
    ports:
      - "16686:16686"  # UI
      - "4317:4317"    # OTLP gRPC
    environment:
      - COLLECTOR_OTLP_ENABLED=true
```

Abrir UI: http://localhost:16686

### Opción 2: Grafana Cloud (producción)
```bash
export OTLP_ENDPOINT=https://otlp-gateway-prod-<region>.grafana.net/otlp
export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Basic <token>"
```

## Visualización de Traces

En Jaeger UI puedes:
- Ver traces completos de requests
- Analizar latencias por span
- Identificar bottlenecks
- Ver dependencias entre servicios

## Métricas en Prometheus

Los servicios exponen métricas en `/metrics` automáticamente si usan FastAPI instrumentation.

```bash
curl http://localhost:3101/metrics
```

## Troubleshooting

### No se envían traces
1. Verificar que Jaeger esté corriendo: `docker ps | grep jaeger`
2. Verificar endpoint: `echo $OTLP_ENDPOINT`
3. Ver logs del servicio: buscar "Tracing configurado"

### Traces incompletos
- Asegurarse de propagar `X-Correlation-Id` entre servicios
- Usar `tracer.start_as_current_span()` dentro de funciones async

### Métricas no aparecen en Prometheus
- Verificar que `/metrics` endpoint esté accesible
- Revisar `prometheus.yml` scrape config
- Verificar labels de métricas (deben ser consistentes)
