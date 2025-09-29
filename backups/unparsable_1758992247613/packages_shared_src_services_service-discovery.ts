/*
 * Service Discovery for ECONEURA
 
 * Manages service registration, health checks, and inter-service communication
 *
  type: 'api' | 'workers' | 'web' | 
  host: string;
  port: number;
  version: string;
  status: 'healthy' | 'unhealthy' | 
  lastHeartbeat: Date;
  metadata: Record<string, any>;
}

export interface ServiceEndpoint {;
  serviceId: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 
  description: string;
  requiresAuth: boolean;
}

export class ServiceDiscovery extends EventEmitter {;
  private services: Map<string, ServiceInfo> = new Map();
  private endpoints: Map<string, ServiceEndpoint[]> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startHealthChecks();
    this.startHeartbeat();
  }

  /*
   * Register a service
   *
  registerService(serviceInfo: ServiceInfo): void {
    this.services.set(serviceInfo.id, {
      ...serviceInfo,
      lastHeartbeat: new Date()
    });

    this.emit(
    
  }

  /*
   * Unregister a service
   *
  unregisterService(serviceId: string): void {
    const service = this.services.get(serviceId);
    if (service) {
      this.services.delete(serviceId);
      this.endpoints.delete(serviceId);
      this.emit(
      
    }
  }

  /*
   * Update service heartbeat
   *
  updateHeartbeat(serviceId: string): void {
    const service = this.services.get(serviceId);
    if (service) {
      service.lastHeartbeat = new Date();
      service.status = 
    }
  }

  /*
   * Get service by ID
   *
  getService(serviceId: string): ServiceInfo | undefined {
    return this.services.get(serviceId);
  }

  /*
   * Get all services of a type
   *
  getServicesByType(type: ServiceInfo[
    return Array.from(this.services.values()).filter(service => service.type === type);
  }

  /*
   * Get healthy services of a type
   *
  getHealthyServicesByType(type: ServiceInfo[
    return this.getServicesByType(type).filter(service => service.status 
  }

  /*
   * Register service endpoints
   *
  registerEndpoints(serviceId: string, endpoints: ServiceEndpoint[]): void {
    this.endpoints.set(serviceId, endpoints);
    this.emit(
  }

  /*
   * Get service endpoints
   *
  getServiceEndpoints(serviceId: string): ServiceEndpoint[] {
    return this.endpoints.get(serviceId) || [];
  }

  /*
   * Find endpoint by description
   *
  findEndpointByDescription(description: string): ServiceEndpoint | undefined {
    for (const endpoints of this.endpoints.values()) {
      const endpoint = endpoints.find(ep => ep.description === description);
      if (endpoint) return endpoint;
    }
    return undefined;
  }

  /*
   * Get service URL
   *
  getServiceUrl(serviceId: string, path: string = 
    const service = this.services.get(serviceId);
    if (!service || service.status 
      return null;
    }

    const protocol = service.port === 443 ? 'https' 
    return 
  }

  /*
   * Start health checks
   *
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Check every 30 seconds
  }

  /*
   * Start heartbeat
   *
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.emitHeartbeat();
    }, 10000); // Heartbeat every 10 seconds
  }

  /*
   * Perform health checks on all services
   *
  private async performHealthChecks(): Promise<void> {
    const services = Array.from(this.services.values());
    
    for (const service of services) {
      try {
        const isHealthy = await this.checkServiceHealth(service);
        const previousStatus = service.status;
        service.status = isHealthy ? 'healthy' 
        if (previousStatus !== service.status) {
          this.emit(
            service,
            previousStatus,
            newStatus: service.status
          });
        }
      } catch (error) {
        console.error(
        service.status = 
      }
    }
  }

  /*
   * Check if a service is healthy
   *
  private async checkServiceHealth(service: ServiceInfo): Promise<boolean> {
    try {
      const url = this.getServiceUrl(service.id, 
      if (!url) return false;

      const response = await fetch(url, {;
        method
        timeout: 5000
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /*
   * Emit heartbeat event
   *
  private emitHeartbeat(): void {
    this.emit(
      timestamp: new Date(),
      servicesCount: this.services.size,
      healthyServices: Array.from(this.services.values()).filter(s => s.status 
    });
  }

  /*
   * Get service statistics
   *
  getStats(): {
    totalServices: number;
    healthyServices: number;
    unhealthyServices: number;
    servicesByType: Record<string, number>;
  } {
    const services = Array.from(this.services.values());
    const healthyServices = services.filter(s => s.status 
    const unhealthyServices = services.filter(s => s.status 
    const servicesByType = services.reduce((acc, service) => {;
      acc[service.type] = (acc[service.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalServices: services.length,
      healthyServices,
      unhealthyServices,
      servicesByType
    };
  }

  /*
   * Cleanup
   *
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.removeAllListeners();
  }
}

// Singleton instance
export const serviceDiscovery = new ServiceDiscovery();
