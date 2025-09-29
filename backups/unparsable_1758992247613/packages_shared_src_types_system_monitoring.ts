
  period: 'hourly' | 'daily' | 
  timestamp: Date;
  
  // API usage
  requests: number;
  bandwidth: number;
  
  // Compute usage
  computeUnits: number;
  storageGb: number;
  
  // AI usage
  aiTokens: number;
  aiCalls: number;
  
  // Costs
  costEur: number;
}

/*
 * Alert configuration
 *
export interface AlertConfig {;
  name: string;
  description: string;
  metric: string;
  condition: 'gt' | 'lt' | 
  threshold: number;
  window: string; // e.g., '5m', 
  severity: 'info' | 'warning' | 'error' | 
  enabled: boolean;
  notifications: {
    channels: string[];
    cooldown: string;
  };
}

/*
 * Alert event
 *
export interface AlertEvent extends TenantEntity {;
  configId: string;
  status: 'triggered' | 
  severity: 'info' | 'warning' | 'error' | 
  metric: string;
  value: number;
  threshold: number;
  message: string;
  metadata: Record<string, unknown>;
}
