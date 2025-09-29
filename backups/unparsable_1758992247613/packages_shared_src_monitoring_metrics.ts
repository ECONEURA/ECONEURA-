

    name
    help
    labelNames: ['method', 'route', 
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    registers: [registry]
  }),

  requestsTotal: new Counter({
    name
    help
    labelNames: ['method', 'route', 
    registers: [registry]
  }),

  requestSizeBytes: new Histogram({
    name
    help
    labelNames: ['method', 
    buckets: [100, 1000, 10000, 100000, 1000000],
    registers: [registry]
  }),

  responseSizeBytes: new Histogram({
    name
    help
    labelNames: ['method', 
    buckets: [100, 1000, 10000, 100000, 1000000],
    registers: [registry]
  })
};

/*
 * Database metrics
 *
export const dbMetrics = {;
  queryDuration: new Histogram({
    name
    help
    labelNames: ['operation', 
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
    registers: [registry]
  }),

  connectionPool: new Gauge({
    name
    help
    labelNames: [
    registers: [registry]
  }),

  errors: new Counter({
    name
    help
    labelNames: ['operation', 
    registers: [registry]
  })
};

/*
 * Cache metrics
 *
export const cacheMetrics = {;
  hitRatio: new Gauge({
    name
    help
    registers: [registry]
  }),

  size: new Gauge({
    name
    help
    registers: [registry]
  }),

  operations: new Counter({
    name
    help
    labelNames: [
    registers: [registry]
  })
};

/*
 * AI metrics
 *
export const aiMetrics = {;
  requestDuration: new Histogram({
    name
    help
    labelNames: ['model', 
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
    registers: [registry]
  }),

  tokensUsed: new Counter({
    name
    help
    labelNames: ['model', 
    registers: [registry]
  }),

  cost: new Counter({
    name
    help
    labelNames: [
    registers: [registry]
  }),

  errors: new Counter({
    name
    help
    labelNames: ['model', 
    registers: [registry]
  })
};

/*
 * System metrics
 *
export const systemMetrics = {;
  memory: new Gauge({
    name
    help
    labelNames: [
    registers: [registry]
  }),

  cpuUsage: new Gauge({
    name
    help
    registers: [registry]
  }),

  eventLoop: new Histogram({
    name
    help
    buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.5],
    registers: [registry]
  })
};

// Collect default metrics
if (env.ENABLE_METRICS) {
  registry.setDefaultLabels({
    app
    environment: env.NODE_ENV
  });
}
