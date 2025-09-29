export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: Record<string, ServiceHealth>;
}

export interface ServiceHealth {
  status: 'up' | 'down';
  responseTime?: number;
  error?: string;
}

export class HealthChecker {
  private services = new Map<string, () => Promise<boolean>>();
  private startTime = Date.now();

  registerService(name: string, check: () => Promise<boolean>): void {
    this.services.set(name, check);
  }

  async checkHealth(): Promise<HealthStatus> {
    const services: Record<string, ServiceHealth> = {};
    let overallStatus: 'healthy' | 'unhealthy' = 'healthy';

    for (const [name, check] of this.services) {
      const startTime = Date.now();
      try {
        const isHealthy = await check();
        const responseTime = Date.now() - startTime;

        services[name] = {
          status: isHealthy ? 'up' : 'down',
          responseTime
        };

        if (!isHealthy) {
          overallStatus = 'unhealthy';
        }
      } catch (error) {
        services[name] = {
          status: 'down',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        overallStatus = 'unhealthy';
      }
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Date.now() - this.startTime,
      services
    };
  }

  getUptime(): number {
    return Date.now() - this.startTime;
  }
}

// Singleton instance
export const healthChecker = new HealthChecker();

// Helper functions
export const createHealthCheck = (check: () => Promise<boolean>) => check;

export const databaseHealthCheck = async (connectionString: string): Promise<boolean> => {
  // Placeholder - implement actual database check
  return connectionString.length > 0;
};

export const redisHealthCheck = async (redisUrl: string): Promise<boolean> => {
  // Placeholder - implement actual Redis check
  return redisUrl.startsWith('redis://');
};