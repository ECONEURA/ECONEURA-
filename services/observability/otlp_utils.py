"""
Utilidades de Observabilidad para ECONEURA
OpenTelemetry tracing, metrics y logging configurados
"""
from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION
import os
import logging

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def setup_observability(service_name: str, service_version: str = "1.0.0"):
    """
    Configura OpenTelemetry para un servicio
    
    Args:
        service_name: Nombre del servicio (ej: "neura-analytics")
        service_version: Versión del servicio
    
    Returns:
        tuple: (tracer, meter) para usar en el servicio
    """
    # Resource identifica el servicio
    resource = Resource(attributes={
        SERVICE_NAME: service_name,
        SERVICE_VERSION: service_version,
        "deployment.environment": os.getenv("ENV", "dev"),
    })
    
    # OTLP endpoint (Jaeger, Grafana Cloud, etc)
    otlp_endpoint = os.getenv("OTLP_ENDPOINT", "http://localhost:4317")
    
    # === TRACING ===
    trace_provider = TracerProvider(resource=resource)
    
    # Exportar traces a OTLP
    otlp_trace_exporter = OTLPSpanExporter(
        endpoint=otlp_endpoint,
        insecure=True  # usar TLS en producción
    )
    trace_provider.add_span_processor(BatchSpanProcessor(otlp_trace_exporter))
    
    trace.set_tracer_provider(trace_provider)
    tracer = trace.get_tracer(service_name, service_version)
    
    logger.info(f"✅ Tracing configurado para {service_name} → {otlp_endpoint}")
    
    # === METRICS ===
    otlp_metric_exporter = OTLPMetricExporter(
        endpoint=otlp_endpoint,
        insecure=True
    )
    
    metric_reader = PeriodicExportingMetricReader(
        otlp_metric_exporter,
        export_interval_millis=30000  # cada 30s
    )
    
    meter_provider = MeterProvider(
        resource=resource,
        metric_readers=[metric_reader]
    )
    
    metrics.set_meter_provider(meter_provider)
    meter = metrics.get_meter(service_name, service_version)
    
    logger.info(f"✅ Metrics configurado para {service_name}")
    
    return tracer, meter

def create_span_attributes(**kwargs) -> dict:
    """
    Helper para crear atributos de span con naming consistente
    """
    return {k: v for k, v in kwargs.items() if v is not None}

# Decorador para instrumentar funciones automáticamente
def traced(span_name: str = None):
    """
    Decorador para agregar tracing a funciones
    
    Ejemplo:
        @traced("process_query")
        async def process_analytics(query: str):
            ...
    """
    def decorator(func):
        import functools
        
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            tracer = trace.get_tracer(__name__)
            name = span_name or f"{func.__module__}.{func.__name__}"
            
            with tracer.start_as_current_span(name) as span:
                try:
                    result = await func(*args, **kwargs)
                    span.set_attribute("success", True)
                    return result
                except Exception as e:
                    span.set_attribute("error", True)
                    span.set_attribute("error.message", str(e))
                    span.record_exception(e)
                    raise
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            tracer = trace.get_tracer(__name__)
            name = span_name or f"{func.__module__}.{func.__name__}"
            
            with tracer.start_as_current_span(name) as span:
                try:
                    result = func(*args, **kwargs)
                    span.set_attribute("success", True)
                    return result
                except Exception as e:
                    span.set_attribute("error", True)
                    span.set_attribute("error.message", str(e))
                    span.record_exception(e)
                    raise
        
        # Detectar si es async
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

# Ejemplo de uso en FastAPI
def instrument_fastapi_app(app, service_name: str):
    """
    Instrumenta una aplicación FastAPI con OpenTelemetry
    
    Ejemplo:
        app = FastAPI()
        instrument_fastapi_app(app, "neura-analytics")
    """
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    
    FastAPIInstrumentor.instrument_app(app)
    logger.info(f"✅ FastAPI app '{service_name}' instrumentada")
    
    # Agregar middleware personalizado si se necesita
    @app.middleware("http")
    async def add_correlation_id(request, call_next):
        correlation_id = request.headers.get("X-Correlation-Id", "unknown")
        
        # Agregar a span actual
        span = trace.get_current_span()
        if span:
            span.set_attribute("correlation.id", correlation_id)
        
        response = await call_next(request)
        response.headers["X-Correlation-Id"] = correlation_id
        return response

if __name__ == "__main__":
    # Test básico
    tracer, meter = setup_observability("test-service")
    
    # Crear un counter
    request_counter = meter.create_counter(
        "requests_total",
        description="Total de requests"
    )
    
    # Crear un span de prueba
    with tracer.start_as_current_span("test_span") as span:
        span.set_attribute("test", True)
        request_counter.add(1, {"endpoint": "/test"})
        print("✅ Span creado exitosamente")
    
    print("✅ Observability test passed")
