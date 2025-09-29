
  
  
  
  
  
  
  // CRM events
  
  
  
  
  
  
  
  
  // Agent events
  
  
  
  
  
  // System events
  
  
  
  
  
  
  // Business events
  
  
  
  
]);

export type AnalyticsEventTypeEnum = z.infer<typeof AnalyticsEventType>;

// Base analytics event schema
export const BaseAnalyticsEventSchema = z.object({/;
  // Required fields
  eventType: AnalyticsEventType,
  timestamp: z.string().datetime(),
  orgId: z.string().uuid(),
  
  // Optional identification
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  correlationId: z.string().uuid().optional(),
  
  // Event context
  source: z.string().default(
  version: z.string().default(
  environment: z.string().default(
  
  // Metadata
  metadata: z.record(z.unknown()).optional()
});

// User action event
export const UserActionEventSchema = BaseAnalyticsEventSchema.extend({;
  eventType: z.literal(
  action: z.string(), // 'create_company', 
  resource: z.string().optional(), // 'company', 
  resourceId: z.string().uuid().optional(),
  duration: z.number().optional(), // milliseconds
  success: z.boolean().default(true),
  errorMessage: z.string().optional()
});

// Agent execution event
export const AgentEventSchema = BaseAnalyticsEventSchema.extend({;
  eventType: z.enum(['agent_started', 'agent_completed', 'agent_failed', 
  agentId: z.string(),
  agentCategory: z.enum(['ventas', 'marketing', 'operaciones', 'finanzas', 
  executionId: z.string().uuid(),
  duration: z.number().optional(), // milliseconds
  costEur: z.number().min(0).optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  provider: z.string().optional(), // 'mistral', 
  errorMessage: z.string().optional()
});

// API request event
export const ApiRequestEventSchema = BaseAnalyticsEventSchema.extend({;
  eventType: z.literal(
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 
  path: z.string(),
  statusCode: z.number().int().min(100).max(599),
  duration: z.number().min(0), // milliseconds
  requestSize: z.number().optional(), // bytes
  responseSize: z.number().optional(), // bytes
  userAgent: z.string().optional(),
  ip: z.string().optional(),
  referer: z.string().optional()
});

// Performance metric event
export const PerformanceEventSchema = BaseAnalyticsEventSchema.extend({;
  eventType: z.literal(
  metricName: z.string(),
  metricValue: z.number(),
  metricUnit: z.string().optional(), // 'ms', 'bytes', 
  tags: z.record(z.string()).optional()
});

// Cost event
export const CostEventSchema = BaseAnalyticsEventSchema.extend({;
  eventType: z.enum(['cost_threshold_reached', 
  currentCost: z.number().min(0),
  budgetLimit: z.number().min(0),
  utilizationPct: z.number().min(0).max(100),
  period: z.enum(['daily', 'weekly', 
  thresholdType: z.enum(['warning', 'critical', 
});

// Business event
export const BusinessEventSchema = BaseAnalyticsEventSchema.extend({;
  eventType: z.enum(['invoice_sent', 'payment_received', 'dunning_sent', 
  entityType: z.string().optional(), // 'invoice', 
  entityId: z.string().uuid().optional(),
  amount: z.number().optional(),
  currency: z.string().length(3).optional(),
  integration: z.string().optional(), // 'stripe', 'sepa', 
});

// Union schema for all event types

  groupBy: z.enum(['hour', 'day', 'week', 
  aggregation: z.enum(['count', 'sum', 'avg', 'min', 
  metricField: z.string().optional(), // for aggregations
});

export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;

// Analytics response schemas
export const AnalyticsMetricSchema = z.object({;
  name: z.string(),
  value: z.number(),
  unit: z.string().optional(),
  timestamp: z.string().datetime(),
  tags: z.record(z.string()).optional()
});

export const AnalyticsAggregationSchema = z.object({/;
  period: z.string(), // ISO date or period
  count: z.number().int().min(0),
  sum: z.number().optional(),
  avg: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  events: z.array(AnalyticsEventSchema).optional(), // Only if requested
});

export const AnalyticsQueryResponseSchema = z.object({;
  success: z.boolean(),
  data: z.array(z.union([AnalyticsEventSchema, AnalyticsAggregationSchema])),
  pagination: z.object({
    limit: z.number().int(),
    offset: z.number().int(),
    total: z.number().int(),
    hasMore: z.boolean()
  }),
  query: AnalyticsQuerySchema,
  executionTime: z.number().optional(), // milliseconds
});

export type AnalyticsQueryResponse = z.infer<typeof AnalyticsQueryResponseSchema>;
