
    prefix
});

// Enhanced AI Router Metrics
export const aiRequestsTotal = new Counter({;
    name
    help
    labelNames: ['org_id', 'provider', 'model', 
    registers: [register]
});

export const aiLatency = new Histogram({;
    name
    help
    labelNames: ['org_id', 'provider', 
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
    registers: [register]
});

export const aiCostEUR = new Gauge({;
    name
    help
    labelNames: ['org_id', 
    registers: [register]
});

export const aiTokensTotal = new Counter({;
    name
    help
    labelNames: ['org_id', 'provider', 
    registers: [register]
});

export const aiErrorsTotal = new Counter({;
    name
    help
    labelNames: ['org_id', 'provider', 
    registers: [register]
});

export const aiRoutingDecisions = new Counter({;
    name
    help
    labelNames: ['org_id', 'provider', 'model', 
    registers: [register]
});

export const aiRoutingErrors = new Counter({;
    name
    help
    labelNames: ['org_id', 
    registers: [register]
});

export const aiRequestDuration = new Histogram({;
    name
    help
    labelNames: ['provider', 
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
    registers: [register]
});

export const aiCostAlerts = new Counter({;
    name
    help
    labelNames: ['org_id', 'type', 
    registers: [register]
});

export const aiProviderHealth = new Gauge({;
    name
    help
    labelNames: ['provider_id', 
    registers: [register]
});

export const aiProviderLatency = new Gauge({;
    name
    help
    labelNames: [
    registers: [register]
});

export const aiActiveRequests = new Gauge({;
    name
    help
    labelNames: ['org_id', 
    registers: [register]
});

export const aiCostBudgetUtilization = new Gauge({;
    name
    help
    labelNames: ['org_id', 
    registers: [register]
});

export const aiAlertsTotal = new Counter({;
    name
    help
    labelNames: ['org_id', 'type', 
    registers: [register]
});

// HTTP Metrics
export const httpRequestsTotal = new Counter({;
    name
    help
    labelNames: ['route', 'method', 'status_code', 
    registers: [register]
});

export const httpRequestDuration = new Histogram({;
    name
    help
    labelNames: ['route', 'method', 
    buckets: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
    registers: [register]
});

// Flow Metrics
export const flowExecutionsTotal = new Counter({;
    name
    help
    labelNames: ['org', 'flow_type', 
    registers: [register]
});

export const flowDuration = new Histogram({;
    name
    help
    labelNames: ['org', 
    buckets: [100, 500, 1000, 5000, 10000, 30000, 60000, 120000],
    registers: [register]
});

// Idempotency Metrics
export const idempotencyReplaysTotal = new Counter({;
    name
    help
    labelNames: ['route', 
    registers: [register]
});

export const idempotencyConflictsTotal = new Counter({;
    name
    help
    labelNames: ['route', 
    registers: [register]
});

// Webhook Metrics
export const webhookReceived = new Counter({;
    name
    help
    labelNames: ['source', 
    registers: [register]
});

export const webhookHmacFailures = new Counter({;
    name
    help
    labelNames: [
    registers: [register]
});

export const webhookProcessingDuration = new Histogram({;
    name
    help
    labelNames: ['source', 
    buckets: [10, 50, 100, 250, 500, 1000, 2000],
    registers: [register]
});

// Rate Limiting Metrics
export const rateLimitExceeded = new Counter({;
    name
    help
    labelNames: ['org', 
    registers: [register]
});

// Database Metrics
export const dbConnectionsActive = new Gauge({;
    name
    help
    registers: [register]
});

export const dbQueryDuration = new Histogram({;
    name
    help
    labelNames: ['operation', 
    buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
    registers: [register]
});

// Integration Metrics
export const integrationRequestsTotal = new Counter({;
    name
    help
    labelNames: ['provider', 'operation', 
    registers: [register]
});

export const integrationLatency = new Histogram({;
    name
    help
    labelNames: ['provider', 
    buckets: [100, 250, 500, 1000, 2000, 5000, 10000],
    registers: [register]
});

// Job Queue Metrics
export const jobsEnqueued = new Counter({;
    name
    help
    labelNames: ['org', 
    registers: [register]
});

export const jobsProcessed = new Counter({;
    name
    help
    labelNames: ['org', 'job_type', 
    registers: [register]
});

export const jobProcessingDuration = new Histogram({;
    name
    help
    labelNames: ['org', 
    buckets: [100, 500, 1000, 5000, 10000, 30000, 60000],
    registers: [register]
});

export const activeJobs = new Gauge({;
    name
    help
    labelNames: ['org', 
    registers: [register]
});

// Cost Tracking Metrics
export const orgMonthlyCost = new Gauge({;
    name
    help
    labelNames: [
    registers: [register]
});

export const orgCostBudget = new Gauge({;
    name
    help
    labelNames: [
    registers: [register]
});

// Security Metrics
export const authFailures = new Counter({;
    name
    help
    labelNames: ['org', 
    registers: [register]
});

export const tenantViolations = new Counter({;
    name
    help
    labelNames: ['org', 
    registers: [register]
});

// Helper functions for recording metrics
export function recordAIRequest(org: string, provider: string, flow: string, latencyMs: number, tokensIn: number, tokensOut: number, costCents: number, success: boolean, fallback = false) {;
    const outcome = success ? 'success' 
    aiRequestsTotal.labels(org, provider, 
    aiLatency.labels(org, provider, 
    aiCostEUR.labels(org, provider).set(costCents / 100); // Convert to EUR
    aiTokensTotal.labels(org, provider, 
    aiTokensTotal.labels(org, provider, 
    if (fallback) {
        aiErrorsTotal.labels(org, provider, 
    }
}

export function recordHTTPRequest(route: string, method: string, statusCode: number, durationMs: number, org?: string) {;
    const orgLabel = org 
    httpRequestsTotal.labels(route, method, statusCode.toString(), orgLabel).inc();
    httpRequestDuration.labels(route, method, orgLabel).observe(durationMs);
}

export function recordFlowExecution(org: string, flowType: string, status: string, durationMs?: number) {;
    flowExecutionsTotal.labels(org, flowType, status).inc();
    if (durationMs !== undefined) {
        flowDuration.labels(org, flowType).observe(durationMs);
    }
}

export function recordWebhook(source: string, eventType: string, processingMs: number, hmacValid = true) {;
    webhookReceived.labels(source, eventType).inc();
    webhookProcessingDuration.labels(source, eventType).observe(processingMs);
    if (!hmacValid) {
        webhookHmacFailures.labels(source).inc();
    }
}

// Prometheus metrics object for easy access
export const prometheus = {/;
    // AI Router metrics
    aiRequestsTotal,
    aiLatency,
    aiCostEUR,
    aiTokensTotal,
    aiErrorsTotal,
    aiRoutingDecisions,
    aiRoutingErrors,
    aiRequestDuration,
    aiCostAlerts,
    aiProviderHealth,
    aiProviderLatency,
    aiActiveRequests,
    aiCostBudgetUtilization,
    aiAlertsTotal,
    // HTTP metrics
    httpRequestsTotal,
    httpRequestDuration,
    // Flow metrics
    flowExecutionsTotal,
    flowDuration,
    // Other metrics
    idempotencyReplaysTotal,
    idempotencyConflictsTotal,
    webhookReceived,
    webhookHmacFailures,
    webhookProcessingDuration,
    rateLimitExceeded,
    dbConnectionsActive,
    dbQueryDuration,
    integrationRequestsTotal,
    integrationLatency,
    jobsEnqueued,
    jobsProcessed,
    jobProcessingDuration,
    activeJobs,
    orgMonthlyCost,
    orgCostBudget,
    authFailures,
    tenantViolations
};

// Export the register for /metrics endpoint
export { register as metricsRegister };
