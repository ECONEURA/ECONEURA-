



app.use(express.json({ limit
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Org-ID', 'X-User-ID', 
}));

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

// Basic API info endpoint
app.get(
  res.json({
    name
    version: process.env.npm_package_version 
    status
    timestamp: new Date().toISOString(),
    endpoints: [
      
      
      
    ]
  });
});

// Basic error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  structuredLogger.error(
    path: req.path,
    method: req.method,
    headers: req.headers
  });

  res.status(500).json({
    error
    message
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    error
    message
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, () => {
  structuredLogger.info(
    port: PORT,
    environment: process.env.NODE_ENV 
    version: process.env.npm_package_version 
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
