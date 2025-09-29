/*
 * Base entity interface with common fields
 *
export interface BaseEntity {;
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/*
 * Base interface for multi-tenant entities
 *
export interface TenantEntity extends BaseEntity {;
  orgId: string;
}

/*
 * Common status types
 *
  sortOrder?: 'asc' | 
}

/*
 * Filter parameters
 *
export interface FilterParams {;
  search?: string;
  filters?: Record<string, unknown>;
  dateFrom?: Date;
  dateTo?: Date;
}
