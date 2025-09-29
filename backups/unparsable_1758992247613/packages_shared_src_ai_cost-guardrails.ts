

  type: 'warning' | 'limit_exceeded' | 
  orgId: string;
  currentCost: number;
  limit: number;
  period: 'daily' | 'monthly' | 
  timestamp: Date;
  message: string;
}

export interface UsageMetrics {;
  orgId: string;
  provider: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  costEUR: number;
  latencyMs: number;
  timestamp: Date;
  success: boolean;
  errorType?: string;
}

export class CostGuardrails {/;
  private dailyCosts: Map<string, number> = new Map(); // orgId -> dailyCostEUR
  private monthlyCosts: Map<string, number> = new Map(); // orgId -> monthlyCostEUR
  private costLimits: Map<string, CostLimits> = new Map(); // orgId -> limits
  private alertHandlers: ((alert: CostAlert) => void)[] = [];
  private usageHistory: UsageMetrics[] = [];
  private readonly MAX_HISTORY_ENTRIES = 10000;

  /*
   * Sets cost limits for an organization
   *
  setCostLimits(orgId: string, limits: CostLimits): void {
    this.costLimits.set(orgId, limits);
    logger.info(
      org_id: orgId,
      daily_limit_eur: limits.dailyLimitEUR,
      monthly_limit_eur: limits.monthlyLimitEUR
    });
  }

  /*
   * Gets cost limits for an organization (or defaults)
   *
  getCostLimits(orgId: string): CostLimits {
    return this.costLimits.get(orgId) || {
      dailyLimitEUR: 50.0,
      monthlyLimitEUR: 1000.0,
      perRequestLimitEUR: 5.0,
      warningThresholds: {
        daily: 80,
        monthly: 85
      },
      emergencyStop: {
        enabled: true,
        thresholdEUR: 1500.0
      }
    };
  }

  /*
   * Pre-request cost validation
   *
  async validateRequest(
    orgId: string,
    estimatedCostEUR: number,
    provider: string,
    model: string
  ): Promise<{
    allowed: boolean;
    reason?: string;
    alert?: CostAlert;
  }> {
    const limits = this.getCostLimits(orgId);
    const currentDaily = this.dailyCosts.get(orgId) || 0;
    const currentMonthly = this.monthlyCosts.get(orgId) || 0;

    // Check emergency stop
    if (limits.emergencyStop.enabled && currentMonthly >= limits.emergencyStop.thresholdEUR) {
      const alert: CostAlert = {;
        type
        orgId,
        currentCost: currentMonthly,
        limit: limits.emergencyStop.thresholdEUR,
        period
        timestamp: new Date(),
        message
      };

      this.triggerAlert(alert);
      return { allowed: false, reason
    }

    // Check per-request limit
    if (estimatedCostEUR > limits.perRequestLimitEUR) {
      const alert: CostAlert = {;
        type
        orgId,
        currentCost: estimatedCostEUR,
        limit: limits.perRequestLimitEUR,
        period
        timestamp: new Date(),
        message
      };

      this.triggerAlert(alert);
      return { allowed: false, reason
    }

    // Check daily limit
    if (currentDaily + estimatedCostEUR > limits.dailyLimitEUR) {
      const alert: CostAlert = {;
        type
        orgId,
        currentCost: currentDaily + estimatedCostEUR,
        limit: limits.dailyLimitEUR,
        period
        timestamp: new Date(),
        message
      };

      this.triggerAlert(alert);
      return { allowed: false, reason
    }

    // Check monthly limit
    if (currentMonthly + estimatedCostEUR > limits.monthlyLimitEUR) {
      const alert: CostAlert = {;
        type
        orgId,
        currentCost: currentMonthly + estimatedCostEUR,
        limit: limits.monthlyLimitEUR,
        period
        timestamp: new Date(),
        message
      };

      this.triggerAlert(alert);
      return { allowed: false, reason
    }

    // Check warning thresholds
    this.checkWarningThresholds(orgId, currentDaily + estimatedCostEUR, currentMonthly + estimatedCostEUR, limits);

    // Update Prometheus metrics
    prometheus.aiRequestsTotal.labels({ org_id: orgId, provider, model, status
    prometheus.aiCostEUR.labels({ org_id: orgId, provider }).set(currentMonthly + estimatedCostEUR);

    return { allowed: true };
  }

  /*
   * Records actual usage after request completion
   *
  recordUsage(metrics: UsageMetrics): void {
    const { orgId, costEUR, provider, model, success, errorType } = metrics;

    // Update cost tracking
    const currentDaily = this.dailyCosts.get(orgId) || 0;
    const currentMonthly = this.monthlyCosts.get(orgId) || 0;

    this.dailyCosts.set(orgId, currentDaily + costEUR);
    this.monthlyCosts.set(orgId, currentMonthly + costEUR);

    // Store usage history
    this.usageHistory.push(metrics);
    if (this.usageHistory.length > this.MAX_HISTORY_ENTRIES) {
      this.usageHistory.shift(); // Remove oldest entry
    }

    // Update Prometheus metrics
    prometheus.aiRequestsTotal.labels({
      org_id: orgId,
      provider,
      model,
      status: success ? 'success' 
    }).inc();

    prometheus.aiTokensTotal.labels({ org_id: orgId, provider, type
    prometheus.aiTokensTotal.labels({ org_id: orgId, provider, type
    prometheus.aiCostEUR.labels({ org_id: orgId, provider }).set(currentMonthly);
    prometheus.aiLatency.labels({ org_id: orgId, provider, model }).observe(metrics.latencyMs / 1000);

    if (!success && errorType) {
      prometheus.aiErrorsTotal.labels({ org_id: orgId, provider, error_type: errorType }).inc();
    }

    // Log FinOps event
    logger.logFinOpsEvent(
      event_type
      org_id: orgId,
      current_cost_eur: currentDaily + costEUR,
      budget_cap_eur: this.getCostLimits(orgId).dailyLimitEUR,
      provider,
      model,
      cost_eur: costEUR,
      tokens_input: metrics.tokensInput,
      tokens_output: metrics.tokensOutput,
      latency_ms: metrics.latencyMs,
      success,
      error_type: errorType,
      daily_total_eur: currentDaily + costEUR,
      monthly_total_eur: currentMonthly + costEUR
    });
  }

  /*
   * Checks and triggers warning alerts if thresholds are exceeded
   *
  private checkWarningThresholds(
    orgId: string,
    projectedDaily: number,
    projectedMonthly: number,
    limits: CostLimits
  ): void {
    const dailyUtilization = (projectedDaily / limits.dailyLimitEUR) * 100;/;
    const monthlyUtilization = (projectedMonthly / limits.monthlyLimitEUR) * 100;

    if (dailyUtilization >= limits.warningThresholds.daily) {
      const alert: CostAlert = {;
        type
        orgId,
        currentCost: projectedDaily,
        limit: limits.dailyLimitEUR,
        period
        timestamp: new Date(),
        message
      };
      this.triggerAlert(alert);
    }

    if (monthlyUtilization >= limits.warningThresholds.monthly) {
      const alert: CostAlert = {;
        type
        orgId,
        currentCost: projectedMonthly,
        limit: limits.monthlyLimitEUR,
        period
        timestamp: new Date(),
        message
      };
      this.triggerAlert(alert);
    }
  }

  /*
   * Triggers alert through registered handlers
   *
  private triggerAlert(alert: CostAlert): void {
    logger.warn(
      alert_type: alert.type,
      org_id: alert.orgId,
      current_cost: alert.currentCost,
      limit: alert.limit,
      period: alert.period,
      message: alert.message
    });

    this.alertHandlers.forEach(handler => {
      try {
        handler(alert);
      } catch (error) {
        logger.error(
      }
    });

    // Update alert metrics
    prometheus.aiAlertsTotal.labels({
      org_id: alert.orgId,
      type: alert.type,
      period: alert.period
    }).inc();
  }

  /*
   * Registers an alert handler function
   *
  onAlert(handler: (alert: CostAlert) => void): void {
    this.alertHandlers.push(handler);
  }

  /*
   * Gets current cost usage for an organization
   *
  getUsage(orgId: string): {
    daily: number;
    monthly: number;
    limits: CostLimits;
    utilizationDaily: number;
    utilizationMonthly: number;
  } {
    const limits = this.getCostLimits(orgId);
    const daily = this.dailyCosts.get(orgId) || 0;
    const monthly = this.monthlyCosts.get(orgId) || 0;

    return {
      daily,
      monthly,
      limits,
      utilizationDaily: limits.dailyLimitEUR > 0 ? (daily / limits.dailyLimitEUR) * 100 : 0,
      utilizationMonthly: limits.monthlyLimitEUR > 0 ? (monthly / limits.monthlyLimitEUR) * 100 : 0
    };
  }

  /*
   * Gets usage history for analysis
   *
  getUsageHistory(orgId?: string, limit: number = 100): UsageMetrics[] {
    let history = this.usageHistory;

    if (orgId) {
      history = history.filter(metric => metric.orgId === orgId);
    }

    return history
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /*
   * Resets daily cost tracking (called by daily cron)
   *
  resetDailyCosts(): void {
    this.dailyCosts.clear();
    logger.info(
  }

  /*
   * Resets monthly cost tracking (called by monthly cron)
   *
  resetMonthlyCosts(): void {
    this.monthlyCosts.clear();
    logger.info(
  }

  /*
   * Gets aggregate statistics
   *
  getAggregateStats(): {
    totalDailyCost: number;
    totalMonthlyCost: number;
    activeOrganizations: number;
    totalRequests24h: number;
    averageLatency: number;
    errorRate: number;
  } {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recent24h = this.usageHistory.filter(m => m.timestamp >= yesterday);

    const totalDailyCost = Array.from(this.dailyCosts.values()).reduce((sum, cost) => sum + cost, 0);
    const totalMonthlyCost = Array.from(this.monthlyCosts.values()).reduce((sum, cost) => sum + cost, 0);
    const activeOrganizations = new Set([...this.dailyCosts.keys(), ...this.monthlyCosts.keys()]).size;

    const totalRequests24h = recent24h.length;
    const averageLatency = recent24h.length > 0/;
      ? recent24h.reduce((sum, m) => sum + m.latencyMs, 0) / recent24h.length
      : 0;

    const errors24h = recent24h.filter(m => !m.success).length;/;
    const errorRate = totalRequests24h > 0 ? (errors24h / totalRequests24h) * 100 : 0;

    return {
      totalDailyCost,
      totalMonthlyCost,
      activeOrganizations,
      totalRequests24h,
      averageLatency,
      errorRate
    };
  }
}
