// ============================================================================
// ECONEURA API SDK - TYPESCRIPT CLIENT
// =========================================================================
import { ;
  BaseResponse,
  PaginatedResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
  CreateApiKeyRequest,
  ApiKeyResponse,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  Contact,
  CreateContactRequest,
  UpdateContactRequest,
  Deal,
  CreateDealRequest,
  UpdateDealRequest,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  Order,
  CreateOrderRequest,
  UpdateOrderRequest,
  AIRequest,
  AIResponse,
  Webhook,
  CreateWebhookRequest,
  UpdateWebhookRequest
} from 

// ============================================================================
// SDK CONFIGURATION
// =========================================================================
export interface SDKConfig {;
  baseUrl: string;
  apiKey?: string;
  accessToken?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class SDKError extends Error {;
  constructor(
    message: string,
    public status?: number,
    public response?: any);
  ) {
    super(message);
    this.name = 
  }
}

// ============================================================================
// HTTP CLIENT
// =========================================================================
class HttpClient {
  private config: SDKConfig;
  private defaultHeaders: Record<string, string>;

  constructor(config: SDKConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      ...config
    };

    this.defaultHeaders = {
      'Content-Type'
      'Accept'
      'User-Agent'
    };

    if (this.config.apiKey) {
      this.defaultHeaders[
    }

    if (this.config.accessToken) {
      this.defaultHeaders[
    }
  }

  private async request<T>(
    method: string,
    path: string,
    data?: any,
    options: { retries?: number } = {}
  ): Promise<T> {
    const url = 
    const retries = options.retries ?? this.config.retries ?? 3;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {;
          method,
          headers: this.defaultHeaders,
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const responseData = await response.json();

        if (!response.ok) {
          throw new SDKError(
            responseData.message 
            response.status,
            responseData
          );
        }

        return responseData;
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }

        if (error instanceof SDKError && error.status && error.status < 500) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      }
    }

    throw new SDKError(
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(
  }

  async post<T>(path: string, data?: any): Promise<T> {
    return this.request<T>(
  }

  async put<T>(path: string, data?: any): Promise<T> {
    return this.request<T>(
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(
  }

  setAccessToken(token: string): void {
    this.config.accessToken = token;
    this.defaultHeaders[
  }

  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.defaultHeaders[
  }
}

// ============================================================================
// ECONEURA SDK
// =========================================================================
export class ECONEURASDK {;
  private http: HttpClient;

  constructor(config: SDKConfig) {
    this.http = new HttpClient(config);
  }

  // ============================================================================
  // AUTHENTICATION
  // =========================================================================
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.http.post<LoginResponse>(
    if (response.data?.accessToken) {
      this.http.setAccessToken(response.data.accessToken);
    }
    return response;
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await this.http.post<RefreshTokenResponse>(
    if (response.data?.accessToken) {
      this.http.setAccessToken(response.data.accessToken);
    }
    return response;
  }

  async logout(request?: LogoutRequest): Promise<BaseResponse> {
    return this.http.post<BaseResponse>(
  }

  async getCurrentUser(): Promise<BaseResponse & { data: User }> {
    return this.http.get<BaseResponse & { data: User }>(
  }

  async createApiKey(request: CreateApiKeyRequest): Promise<BaseResponse & { data: ApiKeyResponse }> {
    return this.http.post<BaseResponse & { data: ApiKeyResponse }>(
  }

  // ============================================================================
  // USERS
  // =========================================================================
  async listUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<User>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set(
    if (params?.limit) searchParams.set(
    if (params?.search) searchParams.set(

    const query = searchParams.toString();/;
    return this.http.get<PaginatedResponse<User>>(`/users${query ? `?${query}` 
  }

  async getUser(id: string): Promise<BaseResponse & { data: User }> {
    return this.http.get<BaseResponse & { data: User }>(
  }

  async createUser(request: CreateUserRequest): Promise<BaseResponse & { data: User }> {
    return this.http.post<BaseResponse & { data: User }>(
  }

  async updateUser(id: string, request: UpdateUserRequest): Promise<BaseResponse & { data: User }> {
    return this.http.put<BaseResponse & { data: User }>(
  }

  async deleteUser(id: string): Promise<void> {
    await this.http.delete(
  }

  // ============================================================================
  // CONTACTS (CRM)
  // =========================================================================
  async listContacts(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Contact>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set(
    if (params?.limit) searchParams.set(
    if (params?.search) searchParams.set(

    const query = searchParams.toString();/;
    return this.http.get<PaginatedResponse<Contact>>(`/contacts${query ? `?${query}` 
  }

  async getContact(id: string): Promise<BaseResponse & { data: Contact }> {
    return this.http.get<BaseResponse & { data: Contact }>(
  }

  async createContact(request: CreateContactRequest): Promise<BaseResponse & { data: Contact }> {
    return this.http.post<BaseResponse & { data: Contact }>(
  }

  async updateContact(id: string, request: UpdateContactRequest): Promise<BaseResponse & { data: Contact }> {
    return this.http.put<BaseResponse & { data: Contact }>(
  }

  async deleteContact(id: string): Promise<void> {
    await this.http.delete(
  }

  // ============================================================================
  // DEALS (CRM)
  // =========================================================================
  async listDeals(params?: {
    page?: number;
    limit?: number;
    stage?: string;
  }): Promise<PaginatedResponse<Deal>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set(
    if (params?.limit) searchParams.set(
    if (params?.stage) searchParams.set(

    const query = searchParams.toString();/;
    return this.http.get<PaginatedResponse<Deal>>(`/deals${query ? `?${query}` 
  }

  async getDeal(id: string): Promise<BaseResponse & { data: Deal }> {
    return this.http.get<BaseResponse & { data: Deal }>(
  }

  async createDeal(request: CreateDealRequest): Promise<BaseResponse & { data: Deal }> {
    return this.http.post<BaseResponse & { data: Deal }>(
  }

  async updateDeal(id: string, request: UpdateDealRequest): Promise<BaseResponse & { data: Deal }> {
    return this.http.put<BaseResponse & { data: Deal }>(
  }

  async deleteDeal(id: string): Promise<void> {
    await this.http.delete(
  }

  // ============================================================================
  // PRODUCTS (ERP)
  // =========================================================================
  async listProducts(params?: {
    page?: number;
    limit?: number;
    category?: string;
  }): Promise<PaginatedResponse<Product>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set(
    if (params?.limit) searchParams.set(
    if (params?.category) searchParams.set(

    const query = searchParams.toString();/;
    return this.http.get<PaginatedResponse<Product>>(`/products${query ? `?${query}` 
  }

  async getProduct(id: string): Promise<BaseResponse & { data: Product }> {
    return this.http.get<BaseResponse & { data: Product }>(
  }

  async createProduct(request: CreateProductRequest): Promise<BaseResponse & { data: Product }> {
    return this.http.post<BaseResponse & { data: Product }>(
  }

  async updateProduct(id: string, request: UpdateProductRequest): Promise<BaseResponse & { data: Product }> {
    return this.http.put<BaseResponse & { data: Product }>(
  }

  async deleteProduct(id: string): Promise<void> {
    await this.http.delete(
  }

  // ============================================================================
  // ORDERS (ERP)
  // =========================================================================
  async listOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<Order>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set(
    if (params?.limit) searchParams.set(
    if (params?.status) searchParams.set(

    const query = searchParams.toString();/;
    return this.http.get<PaginatedResponse<Order>>(`/orders${query ? `?${query}` 
  }

  async getOrder(id: string): Promise<BaseResponse & { data: Order }> {
    return this.http.get<BaseResponse & { data: Order }>(
  }

  async createOrder(request: CreateOrderRequest): Promise<BaseResponse & { data: Order }> {
    return this.http.post<BaseResponse & { data: Order }>(
  }

  async updateOrder(id: string, request: UpdateOrderRequest): Promise<BaseResponse & { data: Order }> {
    return this.http.put<BaseResponse & { data: Order }>(
  }

  async deleteOrder(id: string): Promise<void> {
    await this.http.delete(
  }

  // ============================================================================
  // AI SERVICES
  // =========================================================================
  async aiChat(request: AIRequest): Promise<BaseResponse & { data: AIResponse }> {
    return this.http.post<BaseResponse & { data: AIResponse }>(
  }

  // ============================================================================
  // WEBHOOKS
  // =========================================================================
  async listWebhooks(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Webhook>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set(
    if (params?.limit) searchParams.set(

    const query = searchParams.toString();/;
    return this.http.get<PaginatedResponse<Webhook>>(`/webhooks${query ? `?${query}` 
  }

  async getWebhook(id: string): Promise<BaseResponse & { data: Webhook }> {
    return this.http.get<BaseResponse & { data: Webhook }>(
  }

  async createWebhook(request: CreateWebhookRequest): Promise<BaseResponse & { data: Webhook }> {
    return this.http.post<BaseResponse & { data: Webhook }>(
  }

  async updateWebhook(id: string, request: UpdateWebhookRequest): Promise<BaseResponse & { data: Webhook }> {
    return this.http.put<BaseResponse & { data: Webhook }>(
  }

  async deleteWebhook(id: string): Promise<void> {
    await this.http.delete(
  }

  // ============================================================================
  // SYSTEM
  // =========================================================================
  async healthCheck(): Promise<BaseResponse & { data: any }> {
    return this.http.get<BaseResponse & { data: any }>(
  }

  async getMetrics(): Promise<BaseResponse & { data: any }> {
    return this.http.get<BaseResponse & { data: any }>(
  }

  // ============================================================================
  // UTILITIES
  // =========================================================================
  setAccessToken(token: string): void {
    this.http.setAccessToken(token);
  }

  setApiKey(apiKey: string): void {
    this.http.setApiKey(apiKey);
  }
}

// ============================================================================
// FACTORY FUNCTION
// =========================================================================
export function createSDK(config: SDKConfig): ECONEURASDK {;
  return new ECONEURASDK(config);
}

// ============================================================================
// DEFAULT EXPORT
// =========================================================================
export default ECONEURASDK;
