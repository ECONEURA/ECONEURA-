


  status?: 'active' | 'inactive' | 
}

/*
 * Customer Requests
 *
export interface CreateCustomerRequest {;
  type: CustomerType;
  segment: CustomerSegment;
  priority: CustomerPriority;
  name: string;
  taxId?: string;
  industry?: string;
  website?: string;
  contact: {
    email: string;
    phone?: string;
    mobile?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
    preferredChannel: 'email' | 'phone' | 'sms' | 
  };
  preferences?: Partial<CustomerPreferences>;
  metadata?: Metadata;
}

export interface UpdateCustomerRequest {;
  name?: string;
  type?: CustomerType;
  segment?: CustomerSegment;
  priority?: CustomerPriority;
  status?: 'active' | 
  contact?: Partial<CreateCustomerRequest[
  preferences?: Partial<CustomerPreferences>;
  metadata?: Metadata;
}

/*
 * API Key Requests
 *
export interface CreateApiKeyRequest {;
  name: string;
  expiresAt?: Date;
  scopes: string[];
}

/*
 * Webhook Subscription Request
 *
export interface CreateWebhookSubscriptionRequest {;
  url: string;
  secret: string;
  events: string[];
  description?: string;
  metadata?: Metadata;
}
