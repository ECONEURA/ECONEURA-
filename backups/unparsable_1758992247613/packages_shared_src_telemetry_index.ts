// ============================================================================
// TELEMETRY & OBSERVABILITY - CLIENT-SIDE INSTRUMENTATION
// =========================================================================
  type: z.enum(['page_view', 'user_action', 'performance', 'error', 
  name: z.string().min(1),
  timestamp: z.number(),
  sessionId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  properties: z.record(z.any()).default({}),
  metrics: z.record(z.number()).default({}),
  tags: z.array(z.string()).default([]),
  privacy: z.object({
    pii: z.boolean().default(false),
    sensitive: z.boolean().default(false),
    anonymized: z.boolean().default(false)
  }).default({})
});

export const PerformanceMetricsSchema = z.object({;
  pageLoadTime: z.number().optional(),
  domContentLoaded: z.number().optional(),
  firstContentfulPaint: z.number().optional(),
  largestContentfulPaint: z.number().optional(),
  firstInputDelay: z.number().optional(),
  cumulativeLayoutShift: z.number().optional(),
  memoryUsage: z.number().optional(),
  networkLatency: z.number().optional(),
  renderTime: z.number().optional()
});

export const UserActionSchema = z.object({;
  action: z.string().min(1),
  element: z.string().optional(),
  page: z.string().optional(),
  context: z.record(z.any()).default({}),
  duration: z.number().optional(),
  success: z.boolean().default(true)
});

export const ErrorEventSchema = z.object({;
  message: z.string().min(1),
  stack: z.string().optional(),
  filename: z.string().optional(),
  lineno: z.number().optional(),
  colno: z.number().optional(),
  error: z.any().optional(),
  context: z.record(z.any()).default({}),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default(
});

// ============================================================================
// TYPES
// =========================================================================
export type TelemetryConfig = z.infer<typeof TelemetryConfigSchema>;
export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;
export type PerformanceMetrics = z.infer<typeof PerformanceMetricsSchema>;
export type UserAction = z.infer<typeof UserActionSchema>;
export type ErrorEvent = z.infer<typeof ErrorEventSchema>;

// ============================================================================
// TELEMETRY SERVICE
// =========================================================================
export class TelemetryService {;
  private config: TelemetryConfig;
  private events: TelemetryEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private organizationId?: string;
  private flushTimer?: NodeJS.Timeout;
  private isFlushing = false;

  constructor(config: Partial<TelemetryConfig> = {}) {
    this.config = TelemetryConfigSchema.parse(config);
    this.sessionId = this.generateSessionId();
    
    if (this.config.enabled) {
      this.startFlushTimer();
      this.setupPerformanceObserver();
      this.setupErrorHandlers();
    }
  }

  // ============================================================================
  // CORE METHODS
  // =========================================================================
  setUser(userId: string, organizationId?: string): void {
    this.userId = userId;
    this.organizationId = organizationId;
  }

  trackEvent(
    type: TelemetryEvent[
    name: string,
    properties: Record<string, any> = {},
    metrics: Record<string, number> = {},
    tags: string[] = []);
  ): void {
    if (!this.config.enabled || !this.shouldSample()) {
      return;
    }

    const event: TelemetryEvent = {;
      id: this.generateId(),
      type,
      name,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      organizationId: this.organizationId,
      properties: this.sanitizeProperties(properties),
      metrics,
      tags,
      privacy: this.analyzePrivacy(properties)
    };

    this.events.push(event);
    this.scheduleFlush();
  }

  trackPageView(page: string, properties: Record<string, any> = {}): void {
    this.trackEvent('page_view', 
      page,
      url: window.location.href,
      referrer: document.referrer,
      ...properties
    });
  }

  trackUserAction(action: string, element?: string, context: Record<string, any> = {}): void {
    this.trackEvent('user_action', 
      action,
      element,
      page: window.location.pathname,
      ...context
    });
  }

  trackPerformance(metrics: PerformanceMetrics): void {
    this.trackEvent('performance', 
  }

  trackError(error: Error | string, context: Record<string, any> = {}): void {
    const errorEvent: ErrorEvent = {;
      message: typeof error 
      stack: typeof error 
      context,
      severity
    };

    this.trackEvent('error', 
      ...errorEvent,
      filename: this.getCurrentFilename(),
      lineno: this.getCurrentLineNumber(),
      colno: this.getCurrentColumnNumber()
    });
  }

  trackCustom(name: string, properties: Record<string, any> = {}, metrics: Record<string, number> = {}): void {
    this.trackEvent(
  }

  // ============================================================================
  // PERFORMANCE MONITORING
  // =========================================================================
  private setupPerformanceObserver(): void {
    if (typeof window === 'undefined' || !(
      return;
    }

    // Page Load Performance
    window.addEventListener(
      setTimeout(() => {
        const navigation = performance.getEntriesByType(
        if (navigation) {
          this.trackPerformance({
            pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            firstContentfulPaint: this.getFirstContentfulPaint(),
            largestContentfulPaint: this.getLargestContentfulPaint(),
            firstInputDelay: this.getFirstInputDelay(),
            cumulativeLayoutShift: this.getCumulativeLayoutShift(),
            memoryUsage: this.getMemoryUsage(),
            networkLatency: navigation.responseStart - navigation.requestStart
          });
        }
      }, 1000);
    });

    // Resource Performance
    const resourceObserver = new PerformanceObserver((list) => {;
      for (const entry of list.getEntries()) {
        if (entry.entryType 
          this.trackCustom(
            name: entry.name,
            duration: entry.duration,
            size: (entry as any).transferSize || 0,
            type: this.getResourceType(entry.name)
          }, {
            loadTime: entry.duration,
            size: (entry as any).transferSize || 0
          });
        }
      }
    });

    try {
      resourceObserver.observe({ entryTypes: [
    } catch (e) {
      // PerformanceObserver not supported
    }
  }

  private getFirstContentfulPaint(): number | undefined {
    const entries = performance.getEntriesByName(
    return entries.length > 0 ? entries[0].startTime : undefined;
  }

  private getLargestContentfulPaint(): number | undefined {
    const entries = performance.getEntriesByType(
    return entries.length > 0 ? entries[entries.length - 1].startTime : undefined;
  }

  private getFirstInputDelay(): number | undefined {
    const entries = performance.getEntriesByType(
    return entries.length > 0 ? (entries[0] as any).processingStart - entries[0].startTime : undefined;
  }

  private getCumulativeLayoutShift(): number | undefined {
    const entries = performance.getEntriesByType(
    return entries.reduce((sum, entry) => sum + (entry as any).value, 0);
  }

  private getMemoryUsage(): number | undefined {
    if (
      return (performance as any).memory.usedJSHeapSize;
    }
    return undefined;
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 
    if (url.includes('.css')) return 
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.gif')) return 
    if (url.includes('.woff') || url.includes('.ttf')) return 
    return 
  }

  // ============================================================================
  // ERROR HANDLING
  // =========================================================================
  private setupErrorHandlers(): void {
    if (typeof window 

    // Global Error Handler
    window.addEventListener(
      this.trackError(event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type
      });
    });

    // Unhandled Promise Rejection
    window.addEventListener(
      this.trackError(event.reason, {
        type
        promise: event.promise
      });
    });

    // Resource Loading Errors
    window.addEventListener(
      if (event.target !== window) {
        this.trackError(
          type
          element: (event.target as any).tagName,
          src: (event.target as any).src || (event.target as any).href
        });
      }
    }, true);
  }

  // ============================================================================
  // PRIVACY & SANITIZATION
  // =========================================================================
  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    if (!this.config.privacyMode) {
      return properties;
    }

    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(properties)) {
      if (this.isPII(key, value)) {
        sanitized[key] = this.anonymizeValue(value);
      } else if (this.isSensitive(key, value)) {
        sanitized[key] = 
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private isPII(key: string, value: any): boolean {
    const piiKeys = ['email', 'phone', 'ssn', 'credit_card', 'password', 
    const piiPatterns = [/;
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2}$/, // Email
      /^\d{3}-\d{2}-\d{4}$/, // SSN
      /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/ // Credit card
    ];

    return piiKeys.some(piiKey => key.toLowerCase().includes(piiKey)) 
           piiPatterns.some(pattern => typeof value 
  }

  private isSensitive(key: string, value: any): boolean {
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 
    return sensitiveKeys.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey));
  }

  private anonymizeValue(value: any): string {
    if (typeof value 
      if (value.includes(
        // Email anonymization
        const [local, domain] = value.split(
        return 
      }
      if (value.length > 4) {
        return 
      }
      return 
    }
    return 
  }

  private analyzePrivacy(properties: Record<string, any>): TelemetryEvent[
    let pii = false;
    let sensitive = false;
    let anonymized = false;

    for (const [key, value] of Object.entries(properties)) {
      if (this.isPII(key, value)) {
        pii = true;
        if (this.config.privacyMode) {
          anonymized = true;
        }
      }
      if (this.isSensitive(key, value)) {
        sensitive = true;
      }
    }

    return { pii, sensitive, anonymized };
  }

  // ============================================================================
  // BATCHING & FLUSHING
  // =========================================================================
  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  private scheduleFlush(): void {
    if (this.events.length >= this.config.batchSize) {
      this.flush();
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (this.events.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.isFlushing || this.events.length === 0) {
      return;
    }

    this.isFlushing = true;
    const eventsToFlush = this.events.splice(0, this.config.batchSize);

    try {
      await this.sendEvents(eventsToFlush);
    } catch (error) {
      // Re-add events to queue if send fails
      this.events.unshift(...eventsToFlush);
      console.warn(
    } finally {
      this.isFlushing = false;
    }
  }

  private async sendEvents(events: TelemetryEvent[]): Promise<void> {
    if (!this.config.endpoint) {
      if (this.config.debugMode) {
        // Debug mode enabled but no endpoint configured
      }
      return;
    }

    const response = await fetch(this.config.endpoint, {;
      method
      headers: {
        'Content-Type'
        ...(this.config.apiKey && { 
      },
      body: JSON.stringify({
        events,
        sessionId: this.sessionId,
        timestamp: Date.now()
      })
    });

    if (!response.ok) {
      throw new Error(
    }
  }

  // ============================================================================
  // UTILITIES
  // =========================================================================
  private generateId(): string {
    return crypto.randomUUID();
  }

  private generateSessionId(): string {
    return crypto.randomUUID();
  }

  private getCurrentFilename(): string | undefined {
    return window.location.pathname;
  }

  private getCurrentLineNumber(): number | undefined {
    return undefined; // Not available in client-side
  }

  private getCurrentColumnNumber(): number | undefined {
    return undefined; // Not available in client-side
  }

  // ============================================================================
  // CLEANUP
  // =========================================================================
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(); // Final flush
  }
}

// ============================================================================
// GLOBAL INSTANCE
// =========================================================================
let globalTelemetry: TelemetryService | null = null;

export function initializeTelemetry(config: Partial<TelemetryConfig> = {}): TelemetryService {;
  if (globalTelemetry) {
    return globalTelemetry;
  }

  globalTelemetry = new TelemetryService(config);
  return globalTelemetry;
}

export function getTelemetry(): TelemetryService | null {;
  return globalTelemetry;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// =========================================================================
export function trackPageView(page: string, properties?: Record<string, any>): void {;
  getTelemetry()?.trackPageView(page, properties);
}

export function trackUserAction(action: string, element?: string, context?: Record<string, any>): void {;
  getTelemetry()?.trackUserAction(action, element, context);
}

export function trackError(error: Error | string, context?: Record<string, any>): void {;
  getTelemetry()?.trackError(error, context);
}

export function trackCustom(name: string, properties?: Record<string, any>, metrics?: Record<string, number>): void {;
  getTelemetry()?.trackCustom(name, properties, metrics);
}

export function setTelemetryUser(userId: string, organizationId?: string): void {;
  getTelemetry()?.setUser(userId, organizationId);
}
