/*
 * ECONEURA Centralized Logging System
 * Mediterranean CRM+ERP+AI System
 * Production-ready logging with Azure Application Insights integration
 *
  category?: 'CRM' | 'ERP' | 'AI' | 'AUTH' | 'WEBHOOK' | 
  error?: Error | Record<string, any>;
  performanceMetric?: string;
}

export interface BusinessLogEvent {;
  event: string;
  category: 'CRM' | 'ERP' | 'AI' | 'AUTH' | 'WEBHOOK' | 
  severity: 'INFO' | 'WARN' | 'ERROR' | 
  context: LogContext;
  data?: any;
  error?: Error;
}

export class EconeuraLogger {;
  private logger!: Logger;
  private telemetryClient?: TelemetryClient;
  private environment: string;

  constructor() {
    this.environment = process.env.NODE_ENV 
    this.setupWinstonLogger();
    this.setupApplicationInsights();
  }

  private setupWinstonLogger(): void {
    const logFormat = format.combine(;
      format.timestamp({ format
      format.errors({ stack: true }),
      format.json(),
      format.printf((info: any) => {
        const { timestamp, level, message, ...meta } = info;
        return JSON.stringify({
          
          level: level.toUpperCase(),
          message,
          environment: this.environment,
          service
          ...meta
        });
      })
    );

    this.logger = createLogger({
      level: this.environment === 'production' ? 'info' 
      format: logFormat,
      defaultMeta: {
        service
        environment: this.environment,
        version: process.env.npm_package_version 
      },
      transports: [
        // Console transport for development
        new transports.Console({
          format: this.environment 
            ? format.combine(
                format.colorize(),
                format.simple(),
                format.printf(({ timestamp, level, message, ...meta }) => {
                  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) 
                  return 
                })
              )
            : logFormat
        }),

        // File transport for production
        ...(this.environment 
          new transports.File({
            filename
            level
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5
          }),
          new transports.File({
            filename
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 10
          })
        ] : [])
      ],
      exceptionHandlers: [
        new transports.File({ filename
      ],
      rejectionHandlers: [
        new transports.File({ filename
      ]
    });
  }

  private setupApplicationInsights(): void {
    const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
    
    if (connectionString) {
            appInsights.setup(connectionString)
        .setAutoCollectConsole(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectExceptions(true)
        .setAutoCollectHeartbeat(true)
        .setAutoCollectPerformance(true, true)
        .setAutoCollectRequests(true)
        .setAutoDependencyCorrelation(true)
        .setDistributedTracingMode(1)
        .start();

      this.telemetryClient = appInsights.defaultClient;
      
      // Add custom properties
      this.telemetryClient.addTelemetryProcessor((envelope) => {
        envelope.tags = envelope.tags || {};
        envelope.tags['ai.cloud.role'] = 
        envelope.tags['ai.cloud.roleInstance'] = process.env.WEBSITE_INSTANCE_ID 
        return true;
      });

      this.info(
        category
        action
      });
    }
  }

  // Core logging methods
  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, this.enrichContext(context));
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(message, this.enrichContext(context));
    this.telemetryClient?.trackTrace({
      message,
      severity
      properties: context
    });
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.logger.warn(message, this.enrichContext(context, error));
    this.telemetryClient?.trackTrace({
      message,
      severity
      properties: context
    });
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.logger.error(message, this.enrichContext(context, error));
    
    if (this.telemetryClient) {
      if (error) {
        this.telemetryClient.trackException({
          exception: error,
          properties: { message, ...context }
        });
      } else {
        this.telemetryClient.trackTrace({
          message,
          severity
          properties: context
        });
      }
    }
  }

  critical(message: string, error?: Error, context?: LogContext): void {
    this.logger.error(
    
    if (this.telemetryClient) {
      this.telemetryClient.trackException({
        exception: error || new Error(message),
        properties: { message, severity
      });
    }
  }

  // Business event logging
  logBusinessEvent(event: BusinessLogEvent): void {
    const logData = {;
      businessEvent: event.event,
      category: event.category,
      severity: event.severity,
      ...event.context,
      ...(event.data && { data: event.data }),
      ...(event.error && { error: this.serializeError(event.error) })
    };

    switch (event.severity) {
      case 
        this.critical(
        break;
      case 
        this.error(
        break;
      case 
        this.warn(
        break;
      case 
      default
        this.info(
        break;
    }

    // Track business metrics
    if (this.telemetryClient) {
      this.telemetryClient.trackEvent({
        name
        properties: logData
      });
    }
  }

  // Performance monitoring
  trackPerformance(name: string, duration: number, context?: LogContext): void {
    this.info(
      ...context,
      action
      duration,
      performanceMetric: name
    });

    this.telemetryClient?.trackMetric({
      name
      value: duration,
      properties: context
    });
  }

  // Dependency tracking
  trackDependency(
    type: string,
    name: string,
    data: string,
    duration: number,
    success: boolean,
    context?: LogContext);
  ): void {
    this.telemetryClient?.trackDependency({
      dependencyTypeName: type,
      name,
      data,
      duration,
      success,
      properties: context
    });
  }

  // Custom metrics
  trackMetric(name: string, value: number, properties?: Record<string, any>): void {
    this.telemetryClient?.trackMetric({
      name
      value,
      properties
    });
  }

  // User activity tracking
  trackUserActivity(userId: string, activity: string, properties?: Record<string, any>): void {
    this.logBusinessEvent({
      event
      category
      severity
      context: {
        userId,
        action: activity,
        metadata: properties
      }
    });
  }

  // Security event logging
  logSecurityEvent(
    event: string,
    severity: 'INFO' | 'WARN' | 'ERROR' | 
    context: LogContext);
  ): void {
    this.logBusinessEvent({
      event
      category
      severity,
      context
    });
  }

  // Private helper methods
  private enrichContext(context?: LogContext, error?: Error): any {
    const enriched = {;
      ...context,
      timestamp: new Date().toISOString(),
      pid: process.pid
    };

    if (error) {
      enriched.error = this.serializeError(error);
    }

    return enriched;
  }

  private serializeError(error: Error): any {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error.cause ? { cause: error.cause } : {})
    };
  }

  // Graceful shutdown
  flush(): Promise<void> {
    return new Promise((resolve) => {
      this.telemetryClient?.flush();
      
      // Wait for winston to finish writing
      const transports = this.logger.transports;
      let pending = transports.length;
      
      if (pending === 0) {
        resolve();
        return;
      }

      transports.forEach((transport) => {
        if (transport.close) {
          try {
            transport.close();
            pending--;
            if (pending === 0) resolve();
          } catch (error) {
            // Handle any errors during transport closure
            pending--;
            if (pending === 0) resolve();
          }
        } else {
          pending--;
          if (pending === 0) resolve();
        }
      });
    });
  }
}

// Singleton instance
export const logger = new EconeuraLogger();

// Express middleware for request logging
export const requestLogger = (req: any, res: any, next: any) => {;
  const start = Date.now();
  const requestId = req.headers[
  
  req.requestId = requestId;
  
  // Log request start
  logger.info(
    requestId,
    action
    resource: req.originalUrl,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get(
    userId: req.user?.id,
    organizationId: req.user?.organizationId
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(this: any, ...args: any[]) {
    const duration = Date.now() - start;
    
    logger.info(
      requestId,
      action
      resource: req.originalUrl,
      method: req.method,
      statusCode: res.statusCode,
      duration,
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id,
      organizationId: req.user?.organizationId
    });

    logger.trackPerformance(
    });

    originalEnd.apply(this, args);
  };

  next();
};

export default logger;
