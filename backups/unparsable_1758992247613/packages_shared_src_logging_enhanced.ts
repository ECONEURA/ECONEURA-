

  constructor(service: string = 'unknown', version: string = 
    this.service = service;
    this.version = version;
    this.environment = process.env.NODE_ENV 
    this.logger = pino({
      level: process.env.LOG_LEVEL 
      formatters: {
        level: (label) => ({ level: label }),
        log: (object) => ({
          ts: new Date().toISOString(),
          service: this.service,
          version: this.version,
          environment: this.environment,
          ...object
        })
      },
      redact: {
        paths: [
          
          
          
          
          
          
          
          
        ],
        censor
      },
      serializers: {
        err: pino.stdSerializers.err,
        error: pino.stdSerializers.err
      },
      // Enhanced transport for better development experience
      transport: this.environment 
        target
        options: {
          colorize: true,
          ignore
          translateTime
        }
      } : undefined
    });
  }

  // Core logging methods with enhanced context
  info(msg: string, context?: EnhancedLogContext) {
    this.logger.info(this.enrichContext(context), msg);
  }

  warn(msg: string, context?: EnhancedLogContext) {
    this.logger.warn(this.enrichContext(context), msg);
  }

  error(msg: string, error?: Error, context?: EnhancedLogContext) {
    this.logger.error({ 
      err: error, 
      ...this.enrichContext(context) 
    }, msg);
  }

  debug(msg: string, context?: EnhancedLogContext) {
    this.logger.debug(this.enrichContext(context), msg);
  }

  // Startup and lifecycle logging
  logStartup(msg: string, context: { phase: string; config?: any; duration_ms?: number }) {
    this.logger.info({
      type
      startup_phase: context.phase,
      config: context.config ? this.sanitizeConfig(context.config) : undefined,
      duration_ms: context.duration_ms
    }, msg);
  }

  logShutdown(msg: string, context: { reason?: string; duration_ms?: number }) {
    this.logger.info({
      type
      reason: context.reason,
      duration_ms: context.duration_ms
    }, msg);
  }

  // Database and connection logging
  logDatabaseConnection(msg: string, context: { status: 'connecting' | 'connected' | 'disconnected' | 
    this.logger.info({
      type
      component
      status: context.status,
      latency_ms: context.latency_ms
    }, msg);
  }

  logRedisConnection(msg: string, context: { status: 'connecting' | 'connected' | 'disconnected' | 
    this.logger.info({
      type
      component
      status: context.status,
      latency_ms: context.latency_ms
    }, msg);
  }

  // Queue and worker logging
  logQueueEvent(msg: string, context: { 
    queue_name: string;
    event: 'job_added' | 'job_completed' | 'job_failed' | 'queue_started' | 
    job_id?: string;
    duration_ms?: number;);
  }) {
    this.logger.info({
      type
      component
      queue_name: context.queue_name,
      event: context.event,
      job_id: context.job_id,
      duration_ms: context.duration_ms
    }, msg);
  }

  // Environment validation logging
  logEnvValidation(msg: string, context: { status: 'success' | 'warning' | 
    this.logger.info({
      type
      component
      status: context.status,
      missing_vars: context.missing_vars,
      warnings: context.warnings
    }, msg);
  }

  // Health check logging
  logHealthCheck(msg: string, context: {
    endpoint: string;
    status: 'healthy' | 'unhealthy' | 
    latency_ms?: number;
    dependencies?: Record<string, 'up' | 
  }) {
    this.logger.info({
      type
      component
      endpoint: context.endpoint,
      status: context.status,
      latency_ms: context.latency_ms,
      dependencies: context.dependencies
    }, msg);
  }

  // Create child logger with additional context
  child(context: EnhancedLogContext) {
    const childLogger = new EnhancedEcoNeuraLogger(this.service, this.version);
    childLogger.logger = this.logger.child(this.enrichContext(context));
    return childLogger;
  }

  // Private helper methods
  private enrichContext(context?: EnhancedLogContext): EnhancedLogContext {
    return {
      service: this.service,
      version: this.version,
      environment: this.environment,
      ...context
    };
  }

  private sanitizeConfig(config: any): any {
    // Remove sensitive configuration values for logging
    const sanitized = { ...config };
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 
    
    for (const key in sanitized) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = 
      }
    }
    
    return sanitized;
  }

  // Expose underlying logger for advanced usage
  get pinoLogger(): Logger {
    return this.logger;
  }
}

// Export singleton instances for different services


