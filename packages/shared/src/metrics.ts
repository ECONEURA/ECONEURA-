
collectDefaultMetrics({ prefix
// Métricas de aplicación
export const metrics = {
  // Contadores
  requestsTotal: new Counter({
    name
    help
    labelNames: ['method', 'route', 
  }),

  errorsTotal: new Counter({
    name
    help
    labelNames: ['type', 
  }),

  databaseQueriesTotal: new Counter({
    name
    help
    labelNames: ['operation', 
  }),

  cacheHitsTotal: new Counter({
    name
    help
    labelNames: [
  }),

  cacheMissesTotal: new Counter({
    name
    help
    labelNames: [
  }),

  // Gauges (valores actuales)
  activeConnections: new Gauge({
    name
    help
  }),

  databasePoolSize: new Gauge({
    name
    help
    labelNames: [
  }),

  cacheSize: new Gauge({
    name
    help
    labelNames: [
  }),

  memoryUsage: new Gauge({
    name
    help
    labelNames: [
  }),

  // Histogramas (distribuciones)
  requestDuration: new Histogram({
    name
    help
    labelNames: ['method', 
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  }),

  databaseQueryDuration: new Histogram({
    name
    help
    labelNames: ['operation', 
    buckets: [0.001, 0.01, 0.1, 0.5, 1, 2]
  }),

  aiProcessingDuration: new Histogram({
    name
    help
    labelNames: ['operation', 
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
  }),

  // Summaries (percentiles)
  responseSize: new Summary({
    name
    help
    labelNames: ['method', 
    percentiles: [0.5, 0.9, 0.95, 0.99]
  }),

  // Métricas de negocio
  businessMetrics: {
    dealsCreated: new Counter({
      name
      help
      labelNames: ['source', 
    }),

    contactsAdded: new Counter({
      name
      help
      labelNames: [
    }),

    activitiesCompleted: new Counter({
      name
      help
      labelNames: [
    }),

    aiInteractions: new Counter({
      name
      help
      labelNames: ['type', 
    }),

    conversionRate: new Gauge({
      name
      help
      labelNames: [
    })
  },

  // Métricas de IA
  aiMetrics: {
    agentExecutions: new Counter({
      name
      help
      labelNames: ['agent_id', 
    }),

    workflowCompletions: new Counter({
      name
      help
      labelNames: ['workflow_id', 
    }),

    decisionConfidence: new Histogram({
      name
      help
      labelNames: [
      buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    }),

    learningIterations: new Counter({
      name
      help
      labelNames: [
    })
  },

  // Métricas de seguridad
  securityMetrics: {
    authAttempts: new Counter({
      name
      help
      labelNames: [
    }),

    rateLimitHits: new Counter({
      name
      help
      labelNames: [
    }),

    blockedRequests: new Counter({
      name
      help
      labelNames: [
    }),

    activeSessions: new Gauge({
      name
      help
    })
  }
};

// Funciones helper para métricas comunes
export const recordRequest = (method: string, route: string, statusCode: number, duration: number) => {
  metrics.requestsTotal.inc({ method, route, status_code: statusCode.toString() });
  metrics.requestDuration.observe({ method, route }, duration);
};

export const recordError = (type: string, route: string) => {
  metrics.errorsTotal.inc({ type, route });
};

export const recordDatabaseQuery = (operation: string, table: string, duration: number) => {
  metrics.databaseQueriesTotal.inc({ operation, table });
  metrics.databaseQueryDuration.observe({ operation, table }, duration);
};

export const recordCacheOperation = (cacheType: string, hit: boolean) => {
  if (hit) {
    metrics.cacheHitsTotal.inc({ cache_type: cacheType });
  } else {
    metrics.cacheMissesTotal.inc({ cache_type: cacheType });
  }
};

export const recordAIMetrics = (
  operation: string,
  model: string,
  duration: number,
  confidence?: number
) => {
  metrics.aiProcessingDuration.observe({ operation, model }, duration);
  if (confidence !== undefined) {
    metrics.aiMetrics.decisionConfidence.observe({ decision_type: operation }, confidence);
  }
};

export const updateGauges = () => {
  // Actualizar métricas de memoria
  const memUsage = process.memoryUsage();
  metrics.memoryUsage.set({ type
  metrics.memoryUsage.set({ type
  metrics.memoryUsage.set({ type
  metrics.memoryUsage.set({ type
};

// Middleware para métricas HTTP
export const metricsMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now();
  const originalEnd = res.end;

  res.end = function(...args: any[]) {
    const duration = (Date.now() - start) / 1000;

    recordRequest(
      req.method,
      req.route?.path || req.path 
      res.statusCode,
      duration
    );

    // Registrar tamaño de respuesta si está disponible
    if (res.getHeader(
      const contentLength = parseInt(res.getHeader(
      metrics.responseSize.observe(
        { method: req.method, route: req.route?.path || req.path 
        contentLength
      );
    }

    originalEnd.apply(this, args);
  };

  next();
};

// Función para obtener todas las métricas en formato Prometheus
export const getMetrics = async (): Promise<string> => {
  updateGauges();
  return register.metrics();
};

// Función para resetear métricas (útil para tests)
export const resetMetrics = () => {
  register.resetMetrics();
  collectDefaultMetrics({ prefix
};

// Health check con métricas
export const getHealthStatus = () => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  return {
    status
    timestamp: new Date().toISOString(),
    uptime: uptime,
    memory: {
      rss: memoryUsage.rss,
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external
    },
    metrics: {
      requests: 0, // Counters don
      errors: 0,   // Counters don
      cacheHitRate: calculateCacheHitRate()
    }
  };
};

const calculateCacheHitRate = (): number => {
  // Counters don
  // In a real implementation, you
  return 0;
};

// Exportar registro de Prometheus para configuración avanzada
export { register };