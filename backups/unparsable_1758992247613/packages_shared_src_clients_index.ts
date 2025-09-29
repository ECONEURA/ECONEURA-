// Export all client classes and types
} from 

export {;
  CRMClient,
  type Contact,
  type Company,
  type Deal,
  type Activity,
  type Label,
  type CreateContactInput,
  type UpdateContactInput,
  type CreateCompanyInput,
  type UpdateCompanyInput,
  type CreateDealInput,
  type UpdateDealInput,
  type CreateActivityInput,
  type UpdateActivityInput,
  type CreateLabelInput,
  type UpdateLabelInput
} from 

export {;
  FinanceClient,
  type Account,
  type Transaction,
  type Budget,
  type TaxRate,
  type PaymentTerm,
  type FinancialReport,
  type CreateAccountInput,
  type UpdateAccountInput,
  type CreateTransactionInput,
  type UpdateTransactionInput,
  type CreateBudgetInput,
  type UpdateBudgetInput,
  type CreateTaxRateInput,
  type UpdateTaxRateInput,
  type CreatePaymentTermInput,
  type UpdatePaymentTermInput
} from 

// Main ECONEURA Client Factory
export class ECONEURAClient {;
  private baseURL: string;
  private apiKey?: string;
  private organizationId?: string;

  constructor(config: {
    baseURL: string;
    apiKey?: string;
    organizationId?: string;);
  }) {
    this.baseURL = config.baseURL;
    this.apiKey = config.apiKey;
    this.organizationId = config.organizationId;
  }

  get erp(): ERPClient {
    return new ERPClient({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      organizationId: this.organizationId
    });
  }

  get crm(): CRMClient {
    return new CRMClient({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      organizationId: this.organizationId
    });
  }

  get finance(): FinanceClient {
    return new FinanceClient({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      organizationId: this.organizationId
    });
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  setOrganizationId(organizationId: string): void {
    this.organizationId = organizationId;
  }
}

// Default export for convenience
export default ECONEURAClient;
