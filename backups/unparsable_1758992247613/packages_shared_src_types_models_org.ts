
  billing: 'monthly' | 
  features: string[];
  limits: {
    users: number;
    storage: number;
    apiCalls: number;
  };
}

/*
 * Main organization interface
 *
export interface Organization extends BaseEntity {;
  name: string;
  slug: string;
  status: Status;
  settings: OrganizationSettings;
  plan: SubscriptionPlan;
  metadata: Metadata;
  domain: string;
  logo?: string;
  apiKeys: ApiKey[];
}

/*
 * API key interface
 *
export interface ApiKey {;
  id: string;
  name: string;
  hash: string;
  prefix: string;
  createdAt: Date;
  expiresAt?: Date;
  lastUsedAt?: Date;
  scopes: string[];
  createdBy: string;
}
