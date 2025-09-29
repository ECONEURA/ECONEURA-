



    const route = req.route?.path 
    const method = req.method;

    // Start tracing span
    const span = tracingManager.startSpan(
      attributes: {
        
        
        
        'http.user_agent': req.get('user-agent') 
      }
    });

    // Record request size
    const contentLength = parseInt(req.get('content-length') 
    httpMetrics.requestSizeBytes.observe({ method, route }, contentLength);

    // Hook on finish to capture metrics and logs without overriding end
    res.on?.(
      const duration = (Date.now() - startTime) / 1000;
      const statusCode = String(res.statusCode ?? 0);

      httpMetrics.requestDuration.observe({ method, route, status_code: statusCode }, duration);
      httpMetrics.requestsTotal.inc({ method, route, status_code: statusCode });

      const cl = res.get?.(
      const responseLength = typeof cl 
      httpMetrics.responseSizeBytes.observe({ method, route }, responseLength);

      tracingManager.endSpan(

      const orgIdVal = (req as unknown as Record<string, unknown>)?.org_id;
      logger.logAPIRequest(
        method,
        path: route,
        status_code: Number(statusCode),
        latency_ms: Math.round(duration * 1000),
        org_id: typeof orgIdVal 
      });
    });

    next();
  };
}

/*
 * Error monitoring middleware
 *
export function monitorErrors() {;
  return (error: Error, req: Request, res: Response, next: NextFunction): void => {
    const route = req.route?.path 
    const method = req.method;

    // Record error metrics
    httpMetrics.requestsTotal.inc({
      method,
      route,
      status_code
    });

    // End tracing span with error
    tracingManager.endSpan(

    // Log error
    logger.error(
      request: {
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: req.body
      }
    });

    next(error);
  };
}

/*
 * Health check middleware
 *
export function healthCheck() {;
  return (req: Request, res: Response): void => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();

    // Update system metrics
    Object.entries(memoryUsage).forEach(([type, bytes]) => {
      systemMetrics.memory.set({ type }, bytes as number);
    });

    systemMetrics.cpuUsage.set((cpuUsage.user + cpuUsage.system) / 1000000);

    res.json({
      status
      timestamp: new Date().toISOString(),
      uptime,
      memory: memoryUsage,
      cpu: cpuUsage
    });
  };
}
