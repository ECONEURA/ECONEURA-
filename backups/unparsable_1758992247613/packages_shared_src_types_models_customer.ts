



  preferredChannel: 'email' | 'phone' | 'sms' | 
}

/*
 * Physical address
 *
export interface Address {;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/*
 * Customer preferences
 *
export interface CustomerPreferences {;
  language: string;
  timezone: string;
  currency: string;
  communicationFrequency: 'daily' | 'weekly' | 'monthly' | 
  optIns: {
    marketing: boolean;
    newsletter: boolean;
    productUpdates: boolean;
  };
}

/*
 * Customer main interface
 *
export interface Customer extends TenantEntity {;
  type: CustomerType;
  segment: CustomerSegment;
  priority: CustomerPriority;
  status: Status;
  
  // Basic info
  name: string;
  taxId?: string;
  industry?: string;
  website?: string;
  
  // Contact
  contact: ContactInfo;
  preferences: CustomerPreferences;
  
  // Business info
  accountManager?: string;
  creditLimit?: number;
  paymentTerms?: number;
  
  // Metrics
  lifetimeValue?: number;
  lastPurchaseDate?: Date;
  lastContactDate?: Date;
  
  // Custom fields
  metadata: Metadata;
}

/*
 * Customer contact person
 *
export interface Contact extends TenantEntity {;
  customerId: string;
  firstName: string;
  lastName: string;
  position?: string;
  department?: string;
  email: string;
  phone?: string;
  mobile?: string;
  isMainContact: boolean;
  status: Status;
  preferences?: {
    language: string;
    timezone: string;
  };
  metadata: Metadata;
}
