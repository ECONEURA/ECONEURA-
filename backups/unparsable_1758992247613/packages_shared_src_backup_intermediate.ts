











  res.setHeader('X-Content-Type-Options', 
  res.setHeader('X-Frame-Options', 
  res.setHeader('X-XSS-Protection', 
  res.setHeader('Referrer-Policy', 
  res.setHeader('Permissions-Policy', 
  next();
});

// CORS configuration (PR-28)
app.use(cors({
  origin: ['http://localhost:3000', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Org-ID', 'X-User-ID', 
  exposedHeaders: ['X-System-Mode', 'X-Est-Cost-EUR', 'X-Budget-Pct', 'X-Latency-ms', 
}));

// Basic middleware
app.use(express.json({ limit
app.use(express.urlencoded({ extended: true }));

// Apply observability middleware (PR-23)
app.use(observabilityMiddleware);

// Apply FinOps middleware (PR-29)
app.use(finOpsMiddleware);

// Simple rate limiting (PR-29)
const rateLimitStore = new Map();
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress 
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;
  
  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  const record = rateLimitStore.get(ip);
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return next();
  }
  
  if (record.count >= maxRequests) {
    return res.status(429).json({
      error
      message
      retryAfter: Math.ceil((record.resetTime - now) / 1000)
    });
  }
  
  record.count++;
  next();
});

// Basic validation middleware (PR-27)
app.use((req, res, next) => {
  // Basic request validation
  if (req.headers['content-type'] && req.headers['content-type'].includes(
    if (req.body && typeof req.body 
      return res.status(400).json({
        error
        message
      });
    }
  }
  next();
});

// Basic health check endpoint (< 200ms, no external dependencies)
app.get(
  const ts = new Date().toISOString();
  const version = process.env.npm_package_version 
  const currentMode = healthModeManager.getCurrentMode();
  res.set(
  res.status(200).json({
    status
    ts,
    version,
    mode: currentMode
  });
});

// Enhanced Health check endpoints (PR-22)
app.get(
  try {
    const result = await healthModeManager.getLivenessProbe();
    const statusCode = result.status 
    res.set(
    res.status(statusCode).json(result);
  } catch (error) {
    res.status(503).json({
      status
      mode
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version 
      error: (error as Error).message
    });
  }
});

app.get(
  try {
    const result = await healthModeManager.getReadinessProbe();
    const statusCode = result.status 
    res.set(
    res.status(statusCode).json(result);
  } catch (error) {
    res.status(503).json({
      status
      mode
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version 
      error: (error as Error).message
    });
  }
});

// System metrics endpoint
app.get(
  try {
    const cacheStats = advancedCacheManager.getAllStats();
    const systemHealth = healthMonitor.getSystemHealth();
    
    // Generate Prometheus-style metrics
    const metrics = 
# HELP econeura_cache_hits_total Total number of cache hits
# TYPE econeura_cache_hits_total counter
econeura_cache_hits_total{cache=

# HELP econeura_cache_misses_total Total number of cache misses  
# TYPE econeura_cache_misses_total counter
econeura_cache_misses_total{cache=

# HELP econeura_system_cpu_usage CPU usage percentage
# TYPE econeura_system_cpu_usage gauge
econeura_system_cpu_usage ${systemHealth.cpu.percentage}

# HELP econeura_system_memory_usage Memory usage percentage
# TYPE econeura_system_memory_usage gauge
econeura_system_memory_usage ${systemHealth.memory.percentage}

# HELP econeura_system_uptime_seconds System uptime in seconds
# TYPE econeura_system_uptime_seconds counter
econeura_system_uptime_seconds ${process.uptime()}

    
    res.set('Content-Type', 
    res.send(metrics.trim());
  } catch (error) {
    res.status(500).json({
      error
      message: (error as Error).message
    });
  }
});

// Cache statistics endpoint
app.get(
  try {
    const stats = advancedCacheManager.getAllStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error
      message: (error as Error).message
    });
  }
});

// API info endpoint with comprehensive feature list
app.get(
  res.json({
    name
    version: process.env.npm_package_version 
    status
    timestamp: new Date().toISOString(),
    features: [
      
      
      
      
      
      
      
      
      
      
    ],
    endpoints: [
      
      
      
      
      
      
      
      
      
      
      
      
      
      
    ]
  });
});

// Mount Analytics routes (PR-24)
app.use(

// Mount Events (SSE) routes
app.use(

// Mount Cockpit routes
app.use(

// Basic error handling middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errorId = 
  
  structuredLogger.error(
    errorId,
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    headers: req.headers
  });

  res.status(500).json({
    error
    message
    errorId,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    error
    message
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /health', 'GET /health/live', 'GET /health/ready', 
      'GET /v1/analytics/*', 'GET /v1/events', 
    ]
  });
});

// Start server
const server = app.listen(PORT, () => {
  structuredLogger.info(
    port: PORT,
    environment: process.env.NODE_ENV 
    version: process.env.npm_package_version 
    features: [
      
      
      
      
      
      
      
      
      
      
    ]
  });
});

// Graceful shutdown
process.on(
  structuredLogger.info(
  server.close(() => {
    structuredLogger.info(
    process.exit(0);
  });
});

process.on(
  structuredLogger.info(
  server.close(() => {
    structuredLogger.info(
    process.exit(0);
  });
});

export default app;
