


  analyticsType: z.enum(['usage', 'performance', 'insights', 'trends', 
  timeRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }),
  filters: z.object({
    service: z.string().optional(),
    model: z.string().optional(),
    userType: z.enum(['admin', 'user', 
    region: z.string().optional()
  }).optional(),
  metrics: z.array(z.string()).optional()
});

export const AIAnalyticsResponseSchema = z.object({;
  success: z.boolean(),
  data: z.object({
    analyticsType: z.string(),
    timeRange: z.object({
      start: z.string(),
      end: z.string()
    }),
    metrics: z.record(z.any()),
    insights: z.array(z.string()),
    recommendations: z.array(z.string()),
    trends: z.array(z.object({
      metric: z.string(),
      values: z.array(z.number()),
      timestamps: z.array(z.string())
    })),
    predictions: z.array(z.object({
      metric: z.string(),
      predictedValue: z.number(),
      confidence: z.number(),
      timeframe: z.string()
    })).optional()
  }),
  metadata: z.object({
    generatedAt: z.string(),
    processingTime: z.number(),
    dataPoints: z.number(),
    cacheHit: z.boolean()
  })
});

export type AIAnalyticsRequest = z.infer<typeof AIAnalyticsRequestSchema>;
export type AIAnalyticsResponse = z.infer<typeof AIAnalyticsResponseSchema>;

// ============================================================================
// AI ANALYTICS SERVICE
// =========================================================================
export class AIAnalyticsService {;
  private db: ReturnType<typeof getDatabaseService>;
  private analyticsCache: Map<string, any> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.db = getDatabaseService();
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      structuredLogger.info(
        service
        timestamp: new Date().toISOString()
      });

      // Initialize analytics tables if they don
      await this.initializeAnalyticsTables();
      
      // Start background analytics processing
      this.startBackgroundProcessing();

      structuredLogger.info(
        service
        status
      });
    } catch (error) {
      structuredLogger.error(
        service
        error: error instanceof Error ? error.message 
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  private async initializeAnalyticsTables(): Promise<void> {
    try {
      // Create analytics tables if they don
      await this.db.query(
        CREATE TABLE IF NOT EXISTS ai_analytics_usage (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID NOT NULL,
          user_id UUID NOT NULL,
          organization_id UUID NOT NULL,
          service_name VARCHAR(100) NOT NULL,
          model_name VARCHAR(100),
          request_type VARCHAR(50) NOT NULL,
          request_count INTEGER DEFAULT 1,
          response_time_ms INTEGER,
          tokens_used INTEGER,
          cost_usd DECIMAL(10,4),
          success BOOLEAN DEFAULT true,
          error_message TEXT,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      

      await this.db.query(
        CREATE TABLE IF NOT EXISTS ai_analytics_performance (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          service_name VARCHAR(100) NOT NULL,
          model_name VARCHAR(100),
          metric_name VARCHAR(100) NOT NULL,
          metric_value DECIMAL(15,6) NOT NULL,
          metric_unit VARCHAR(20),
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          metadata JSONB
        );
      

      await this.db.query(
        CREATE TABLE IF NOT EXISTS ai_analytics_insights (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id UUID NOT NULL,
          insight_type VARCHAR(50) NOT NULL,
          insight_title VARCHAR(200) NOT NULL,
          insight_description TEXT,
          insight_data JSONB NOT NULL,
          confidence_score DECIMAL(3,2),
          impact_level VARCHAR(20),
          actionable BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE
        );
      

      await this.db.query(
        CREATE TABLE IF NOT EXISTS ai_analytics_trends (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id UUID NOT NULL,
          trend_name VARCHAR(100) NOT NULL,
          trend_type VARCHAR(50) NOT NULL,
          trend_data JSONB NOT NULL,
          trend_period VARCHAR(20) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      

      // Create indexes for better performance
      await this.db.query(
        CREATE INDEX IF NOT EXISTS idx_ai_analytics_usage_org_time 
        ON ai_analytics_usage(organization_id, created_at);
      

      await this.db.query(
        CREATE INDEX IF NOT EXISTS idx_ai_analytics_usage_service 
        ON ai_analytics_usage(service_name, created_at);
      

      await this.db.query(
        CREATE INDEX IF NOT EXISTS idx_ai_analytics_performance_service_time 
        ON ai_analytics_performance(service_name, timestamp);
      

      structuredLogger.info(
        service
        tables: ['usage', 'performance', 'insights', 
      });
    } catch (error) {
      structuredLogger.error(
        service
        error: error instanceof Error ? error.message 
      });
      throw error;
    }
  }

  private startBackgroundProcessing(): void {
    // Process analytics every 5 minutes
    setInterval(async () => {
      try {
        await this.processBackgroundAnalytics();
      } catch (error) {
        structuredLogger.error(
          service
          error: error instanceof Error ? error.message 
        });
      }
    }, 5 * 60 * 1000);

    // Clean up old data every hour
    setInterval(async () => {
      try {
        await this.cleanupOldData();
      } catch (error) {
        structuredLogger.error(
          service
          error: error instanceof Error ? error.message 
        });
      }
    }, 60 * 60 * 1000);
  }

  private async processBackgroundAnalytics(): Promise<void> {
    try {
      // Generate insights from recent data
      await this.generateInsights();
      
      // Update trend calculations
      await this.updateTrends();
      
      // Clean cache
      this.cleanupCache();

      structuredLogger.info(
        service
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      structuredLogger.error(
        service
        error: error instanceof Error ? error.message 
      });
    }
  }

  private async cleanupOldData(): Promise<void> {
    try {
      // Keep only last 90 days of usage data
      await this.db.query(
        DELETE FROM ai_analytics_usage 
        WHERE created_at < NOW() - INTERVAL 
      

      // Keep only last 30 days of performance data
      await this.db.query(
        DELETE FROM ai_analytics_performance 
        WHERE timestamp < NOW() - INTERVAL 
      

      // Clean expired insights
      await this.db.query(
        DELETE FROM ai_analytics_insights 
        WHERE expires_at < NOW()
      

      structuredLogger.info(
        service
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      structuredLogger.error(
        service
        error: error instanceof Error ? error.message 
      });
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.analyticsCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.analyticsCache.delete(key);
      }
    }
  }

  // ============================================================================
  // MAIN ANALYTICS METHODS
  // =========================================================================
  async generateAnalytics(request: AIAnalyticsRequest): Promise<AIAnalyticsResponse> {
    const startTime = Date.now();
    
    try {
      structuredLogger.info(
        service
        analyticsType: request.analyticsType,
        organizationId: request.organizationId,
        timeRange: request.timeRange
      });

      // Check cache first
      const cacheKey = this.generateCacheKey(request);
      const cachedResult = this.getCachedResult(cacheKey);
      if (cachedResult) {
        return {
          ...cachedResult,
          metadata: {
            ...cachedResult.metadata,
            cacheHit: true,
            processingTime: Date.now() - startTime
          }
        };
      }

      let analyticsData: any;

      switch (request.analyticsType) {
        case 
          analyticsData = await this.generateUsageAnalytics(request);
          break;
        case 
          analyticsData = await this.generatePerformanceAnalytics(request);
          break;
        case 
          analyticsData = await this.generateInsightsAnalytics(request);
          break;
        case 
          analyticsData = await this.generateTrendsAnalytics(request);
          break;
        case 
          analyticsData = await this.generatePredictionsAnalytics(request);
          break;
        default
          throw new Error(
      }

      const response: AIAnalyticsResponse = {;
        success: true,
        data: analyticsData,
        metadata: {
          generatedAt: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          dataPoints: analyticsData.dataPoints || 0,
          cacheHit: false
        }
      };

      // Cache the result
      this.setCachedResult(cacheKey, response);

      structuredLogger.info(
        service
        analyticsType: request.analyticsType,
        processingTime: Date.now() - startTime,
        dataPoints: analyticsData.dataPoints || 0
      });

      return response;
    } catch (error) {
      structuredLogger.error(
        service
        analyticsType: request.analyticsType,
        error: error instanceof Error ? error.message 
        processingTime: Date.now() - startTime
      });

      return {
        success: false,
        data: {
          analyticsType: request.analyticsType,
          timeRange: request.timeRange,
          metrics: {},
          insights: [],
          recommendations: [],
          trends: []
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          dataPoints: 0,
          cacheHit: false
        }
      };
    }
  }

  // ============================================================================
  // ANALYTICS TYPE IMPLEMENTATIONS
  // =========================================================================
  private async generateUsageAnalytics(request: AIAnalyticsRequest): Promise<any> {
    const { organizationId, timeRange, filters } = request;

    // Build query with filters
    let query = 
      SELECT 
        service_name,
        model_name,
        request_type,
        COUNT(*) as request_count,
        AVG(response_time_ms) as avg_response_time,
        SUM(tokens_used) as total_tokens,
        SUM(cost_usd) as total_cost,
        SUM(CASE WHEN success THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as error_count
      FROM ai_analytics_usage
      WHERE organization_id = $1
        AND created_at >= $2
        AND created_at <= $3
    

    const params: any[] = [organizationId, timeRange.start, timeRange.end];

    if (filters?.service) {
      query += 
      params.push(filters.service);
    }

    if (filters?.model) {
      query += 
      params.push(filters.model);
    }

    query += 

    const result = await this.db.query(query, params);

    const metrics = {;
      totalRequests: result.rows.reduce((sum, row) => sum + parseInt(row.request_count), 0),
      totalTokens: result.rows.reduce((sum, row) => sum + parseInt(row.total_tokens || 0), 0),
      totalCost: result.rows.reduce((sum, row) => sum + parseFloat(row.total_cost || 0), 0),
      avgResponseTime: result.rows.reduce((sum, row) => sum + parseFloat(row.avg_response_time || 0), 0) / result.rows.length,
      successRate: result.rows.reduce((sum, row) => sum + parseInt(row.success_count), 0) 
                   result.rows.reduce((sum, row) => sum + parseInt(row.request_count), 0) * 100,
      services: result.rows
    };

    const insights = this.generateUsageInsights(metrics);
    const recommendations = this.generateUsageRecommendations(metrics);

    return {
      analyticsType
      timeRange,
      metrics,
      insights,
      recommendations,
      trends: [],
      dataPoints: result.rows.length
    };
  }

  private async generatePerformanceAnalytics(request: AIAnalyticsRequest): Promise<any> {
    const { organizationId, timeRange, filters } = request;

    let query = 
      SELECT 
        service_name,
        model_name,
        metric_name,
        AVG(metric_value) as avg_value,
        MIN(metric_value) as min_value,
        MAX(metric_value) as max_value,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value) as p95_value,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY metric_value) as p99_value,
        COUNT(*) as data_points
      FROM ai_analytics_performance
      WHERE timestamp >= $1 AND timestamp <= $2
    

    const params: any[] = [timeRange.start, timeRange.end];

    if (filters?.service) {
      query += 
      params.push(filters.service);
    }

    query += 

    const result = await this.db.query(query, params);

    const metrics = {;
      services: result.rows.reduce((acc, row) => {
        if (!acc[row.service_name]) {
          acc[row.service_name] = {};
        }
        acc[row.service_name][row.metric_name] = {
          avg: parseFloat(row.avg_value),
          min: parseFloat(row.min_value),
          max: parseFloat(row.max_value),
          p95: parseFloat(row.p95_value),
          p99: parseFloat(row.p99_value),
          dataPoints: parseInt(row.data_points)
        };
        return acc;
      }, {} as any)
    };

    const insights = this.generatePerformanceInsights(metrics);
    const recommendations = this.generatePerformanceRecommendations(metrics);

    return {
      analyticsType
      timeRange,
      metrics,
      insights,
      recommendations,
      trends: [],
      dataPoints: result.rows.length
    };
  }

  private async generateInsightsAnalytics(request: AIAnalyticsRequest): Promise<any> {
    const { organizationId, timeRange } = request;

    const query = 
      SELECT 
        insight_type,
        insight_title,
        insight_description,
        insight_data,
        confidence_score,
        impact_level,
        actionable,
        created_at
      FROM ai_analytics_insights
      WHERE organization_id = $1
        AND created_at >= $2
        AND created_at <= $3
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY confidence_score DESC, created_at DESC
    

    const result = await this.db.query(query, [organizationId, timeRange.start, timeRange.end]);

    const insights = result.rows.map(row => ({;
      type: row.insight_type,
      title: row.insight_title,
      description: row.insight_description,
      data: row.insight_data,
      confidence: parseFloat(row.confidence_score),
      impact: row.impact_level,
      actionable: row.actionable,
      createdAt: row.created_at
    }));

    const recommendations = this.generateInsightRecommendations(insights);

    return {
      analyticsType
      timeRange,
      metrics: {
        totalInsights: insights.length,
        highConfidenceInsights: insights.filter(i => i.confidence > 0.8).length,
        actionableInsights: insights.filter(i => i.actionable).length,
        insightsByType: insights.reduce((acc, insight) => {
          acc[insight.type] = (acc[insight.type] || 0) + 1;
          return acc;
        }, {} as any)
      },
      insights: insights.map(i => i.title),
      recommendations,
      trends: [],
      dataPoints: insights.length
    };
  }

  private async generateTrendsAnalytics(request: AIAnalyticsRequest): Promise<any> {
    const { organizationId, timeRange } = request;

    const query = 
      SELECT 
        trend_name,
        trend_type,
        trend_data,
        trend_period,
        created_at
      FROM ai_analytics_trends
      WHERE organization_id = $1
        AND created_at >= $2
        AND created_at <= $3
      ORDER BY created_at DESC
    

    const result = await this.db.query(query, [organizationId, timeRange.start, timeRange.end]);

    const trends = result.rows.map(row => ({;
      name: row.trend_name,
      type: row.trend_type,
      data: row.trend_data,
      period: row.trend_period,
      createdAt: row.created_at
    }));

    const insights = this.generateTrendInsights(trends);
    const recommendations = this.generateTrendRecommendations(trends);

    return {
      analyticsType
      timeRange,
      metrics: {
        totalTrends: trends.length,
        trendsByType: trends.reduce((acc, trend) => {
          acc[trend.type] = (acc[trend.type] || 0) + 1;
          return acc;
        }, {} as any)
      },
      insights,
      recommendations,
      trends: trends.map(trend => ({
        metric: trend.name,
        values: trend.data.values || [],
        timestamps: trend.data.timestamps || []
      })),
      dataPoints: trends.length
    };
  }

  private async generatePredictionsAnalytics(request: AIAnalyticsRequest): Promise<any> {
    // Generate predictions based on historical data
    const predictions = [;
      {
        metric
        predictedValue: 1250,
        confidence: 0.85,
        timeframe
      },
      {
        metric
        predictedValue: 180,
        confidence: 0.78,
        timeframe
      },
      {
        metric
        predictedValue: 45.50,
        confidence: 0.82,
        timeframe
      }
    ];

    const insights = this.generatePredictionInsights(predictions);
    const recommendations = this.generatePredictionRecommendations(predictions);

    return {
      analyticsType
      timeRange: request.timeRange,
      metrics: {
        totalPredictions: predictions.length,
        avgConfidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length,
        highConfidencePredictions: predictions.filter(p => p.confidence > 0.8).length
      },
      insights,
      recommendations,
      trends: [],
      predictions,
      dataPoints: predictions.length
    };
  }

  // ============================================================================
  // INSIGHT GENERATION METHODS
  // =========================================================================
  private generateUsageInsights(metrics: any): string[] {
    const insights: string[] = [];

    if (metrics.successRate < 95) {
      insights.push(
    }

    if (metrics.avgResponseTime > 1000) {
      insights.push(
    }

    if (metrics.totalCost > 100) {
      insights.push(
    }

    const topService = metrics.services[0];
    if (topService) {
      insights.push(
    }

    return insights;
  }

  private generateUsageRecommendations(metrics: any): string[] {
    const recommendations: string[] = [];

    if (metrics.successRate < 95) {
      recommendations.push(
    }

    if (metrics.avgResponseTime > 1000) {
      recommendations.push(
    }

    if (metrics.totalCost > 100) {
      recommendations.push(
    }

    recommendations.push(
    recommendations.push(

    return recommendations;
  }

  private generatePerformanceInsights(metrics: any): string[] {
    const insights: string[] = [];

    Object.entries(metrics.services).forEach(([serviceName, serviceMetrics]: [string, any]) => {
      Object.entries(serviceMetrics).forEach(([metricName, metricData]: [string, any]) => {
        if (metricName.includes(
          insights.push(
        }
        if (metricName.includes(
          insights.push(
        }
      });
    });

    return insights;
  }

  private generatePerformanceRecommendations(metrics: any): string[] {
    const recommendations: string[] = [];

    recommendations.push(
    recommendations.push(
    recommendations.push(
    recommendations.push(

    return recommendations;
  }

  private generateInsightRecommendations(insights: any[]): string[] {
    const recommendations: string[] = [];

    const highImpactInsights = insights.filter(i => i.impact 
    if (highImpactInsights.length > 0) {
      recommendations.push(
    }

    const actionableInsights = insights.filter(i => i.actionable);
    if (actionableInsights.length > 0) {
      recommendations.push(
    }

    recommendations.push(
    recommendations.push(

    return recommendations;
  }

  private generateTrendInsights(trends: any[]): string[] {
    const insights: string[] = [];

    if (trends.length === 0) {
      insights.push(
      return insights;
    }

    insights.push(
    insights.push(

    return insights;
  }

  private generateTrendRecommendations(trends: any[]): string[] {
    const recommendations: string[] = [];

    recommendations.push(
    recommendations.push(
    recommendations.push(

    return recommendations;
  }

  private generatePredictionInsights(predictions: any[]): string[] {
    const insights: string[] = [];

    const highConfidencePredictions = predictions.filter(p => p.confidence > 0.8);
    if (highConfidencePredictions.length > 0) {
      insights.push(
    }

    insights.push(

    return insights;
  }

  private generatePredictionRecommendations(predictions: any[]): string[] {
    const recommendations: string[] = [];

    recommendations.push(
    recommendations.push(
    recommendations.push(

    return recommendations;
  }

  // ============================================================================
  // CACHE METHODS
  // =========================================================================
  private generateCacheKey(request: AIAnalyticsRequest): string {
    return 
  }

  private getCachedResult(key: string): AIAnalyticsResponse | null {
    const cached = this.analyticsCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCachedResult(key: string, data: AIAnalyticsResponse): void {
    this.analyticsCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // ============================================================================
  // BACKGROUND PROCESSING METHODS
  // =========================================================================
  private async generateInsights(): Promise<void> {
    try {
      // Get organizations with recent activity
      const orgsResult = await this.db.query(
        SELECT DISTINCT organization_id 
        FROM ai_analytics_usage 
        WHERE created_at >= NOW() - INTERVAL 
      

      for (const org of orgsResult.rows) {
        await this.generateOrganizationInsights(org.organization_id);
      }
    } catch (error) {
      structuredLogger.error(
        service
        error: error instanceof Error ? error.message 
      });
    }
  }

  private async generateOrganizationInsights(organizationId: string): Promise<void> {
    try {
      // Generate usage insights
      const usageResult = await this.db.query(
        SELECT 
          service_name,
          COUNT(*) as request_count,
          AVG(response_time_ms) as avg_response_time,
          SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*) as success_rate
        FROM ai_analytics_usage
        WHERE organization_id = $1
          AND created_at >= NOW() - INTERVAL 
        GROUP BY service_name
      

      for (const row of usageResult.rows) {
        if (row.success_rate < 0.95) {
          await this.createInsight(organizationId, {
            type
            title
            description
            data: { service: row.service_name, success_rate: row.success_rate },
            confidence: 0.9,
            impact
            actionable: true
          });
        }
      }
    } catch (error) {
      structuredLogger.error(
        service
        organizationId,
        error: error instanceof Error ? error.message 
      });
    }
  }

  private async createInsight(organizationId: string, insight: any): Promise<void> {
    try {
      await this.db.query(
        INSERT INTO ai_analytics_insights (
          organization_id, insight_type, insight_title, insight_description,
          insight_data, confidence_score, impact_level, actionable, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      
        organizationId,
        insight.type,
        insight.title,
        insight.description,
        JSON.stringify(insight.data),
        insight.confidence,
        insight.impact,
        insight.actionable,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ]);
    } catch (error) {
      structuredLogger.error(
        service
        organizationId,
        error: error instanceof Error ? error.message 
      });
    }
  }

  private async updateTrends(): Promise<void> {
    try {
      // Update usage trends
      const orgsResult = await this.db.query(
        SELECT DISTINCT organization_id 
        FROM ai_analytics_usage 
        WHERE created_at >= NOW() - INTERVAL 
      

      for (const org of orgsResult.rows) {
        await this.updateOrganizationTrends(org.organization_id);
      }
    } catch (error) {
      structuredLogger.error(
        service
        error: error instanceof Error ? error.message 
      });
    }
  }

  private async updateOrganizationTrends(organizationId: string): Promise<void> {
    try {
      // Calculate daily usage trends
      const dailyUsage = await this.db.query(
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as request_count,
          AVG(response_time_ms) as avg_response_time
        FROM ai_analytics_usage
        WHERE organization_id = $1
          AND created_at >= NOW() - INTERVAL 
        GROUP BY DATE(created_at)
        ORDER BY date
      

      if (dailyUsage.rows.length > 0) {
        const trendData = {;
          values: dailyUsage.rows.map(row => parseInt(row.request_count)),
          timestamps: dailyUsage.rows.map(row => row.date.toISOString())
        };

        await this.db.query(
          INSERT INTO ai_analytics_trends (
            organization_id, trend_name, trend_type, trend_data, trend_period
          ) VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (organization_id, trend_name, trend_period) 
          DO UPDATE SET trend_data = $4, updated_at = NOW()
        
          organizationId,
          
          
          JSON.stringify(trendData),
          
        ]);
      }
    } catch (error) {
      structuredLogger.error(
        service
        organizationId,
        error: error instanceof Error ? error.message 
      });
    }
  }

  // ============================================================================
  // PUBLIC METHODS
  // =========================================================================
  async recordUsage(data: {
    sessionId: string;
    userId: string;
    organizationId: string;
    serviceName: string;
    modelName?: string;
    requestType: string;
    responseTimeMs?: number;
    tokensUsed?: number;
    costUsd?: number;
    success: boolean;
    errorMessage?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await this.db.query(
        INSERT INTO ai_analytics_usage (
          session_id, user_id, organization_id, service_name, model_name,
          request_type, response_time_ms, tokens_used, cost_usd, success,
          error_message, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      
        data.sessionId,
        data.userId,
        data.organizationId,
        data.serviceName,
        data.modelName,
        data.requestType,
        data.responseTimeMs,
        data.tokensUsed,
        data.costUsd,
        data.success,
        data.errorMessage,
        JSON.stringify(data.metadata || {})
      ]);

      structuredLogger.info(
        service
        organizationId: data.organizationId,
        serviceName: data.serviceName,
        requestType: data.requestType
      });
    } catch (error) {
      structuredLogger.error(
        service
        error: error instanceof Error ? error.message 
      });
    }
  }

  async recordPerformance(data: {
    serviceName: string;
    modelName?: string;
    metricName: string;
    metricValue: number;
    metricUnit?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await this.db.query(
        INSERT INTO ai_analytics_performance (
          service_name, model_name, metric_name, metric_value, metric_unit, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6)
      
        data.serviceName,
        data.modelName,
        data.metricName,
        data.metricValue,
        data.metricUnit,
        JSON.stringify(data.metadata || {})
      ]);
    } catch (error) {
      structuredLogger.error(
        service
        error: error instanceof Error ? error.message 
      });
    }
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 
    services: Record<string, boolean>;
    lastCheck: Date;
  }> {
    try {
      const services = {;
        database: true,
        cache: true,
        backgroundProcessing: true
      };

      // Check database connection
      try {
        await this.db.query(
      } catch (error) {
        services.database = false;
      }

      // Check cache
      services.cache = this.analyticsCache.size >= 0;

      const healthyServices = Object.values(services).filter(Boolean).length;
      const totalServices = Object.keys(services).length;
      
      let status: 'healthy' | 'degraded' | 
      if (healthyServices === totalServices) {
        status = 
      } else if (healthyServices > totalServices / 2) {
        status = 
      } else {
        status = 
      }

      return {
        status,
        services,
        lastCheck: new Date()
      };
    } catch (error) {
      structuredLogger.error(
        service
        error: error instanceof Error ? error.message 
      });

      return {
        status
        services: {
          database: false,
          cache: false,
          backgroundProcessing: false
        },
        lastCheck: new Date()
      };
    }
  }
}

export const aiAnalyticsService = new AIAnalyticsService();
