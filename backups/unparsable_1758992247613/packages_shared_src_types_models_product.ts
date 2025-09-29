
  | 
  | 
  | 
  | 
  | 

// Product status
export type ProductStatus = ;
  | 
  | 
  | 
  | 

// Product pricing
export interface ProductPricing {;
  basePrice: number;
  cost?: number;
  margin?: number;
  discounts?: {
    bulk?: {
      quantity: number;
      discount: number;
    }[];
    seasonal?: {
      startDate: Date;
      endDate: Date;
      discount: number;
    }[];
  };
  taxes?: {
    rate: number;
    type: string;
  };
}
