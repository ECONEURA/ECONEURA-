

  status: 'healthy' | 'degraded' | 
  version: string;
  uptime: number;
  checks: {
    [key: string]: {
      status: 'up' | 
      latency?: number;
      message?: string;
      lastChecked: Date;
    };
  };
}
