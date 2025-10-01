declare module '@econeura/shared' {
  // Basic config/environment
  export function env(): any;

  // Logging shims
  export const logger: {
    info: (msg: string, ...args: any[]) => void;
    warn: (msg: string, ...args: any[]) => void;
    error: (msg: string, ...args: any[]) => void;
    debug: (msg: string, ...args: any[]) => void;
  };

  export const apiLogger: {
    logStartup: (msg: string, meta?: any) => void;
    logShutdown: (msg: string, meta?: any) => void;
  };

  // Auth types
  export type LoginRequest = any;
  export type LoginResponse = any;
  export type RefreshTokenRequest = any;
  export type RefreshTokenResponse = any;
  export type LogoutRequest = any;
  export type MeResponse = any;
  export type SessionsResponse = any;

  // CRM types
  export type Company = any;
  export type CreateCompany = any;
  export type UpdateCompany = any;
  export type CompanyFilter = any;
  export type Contact = any;
  export type CreateContact = any;
  export type UpdateContact = any;
  export type ContactFilter = any;
  export type Deal = any;
  export type CreateDeal = any;
  export type UpdateDeal = any;
  export type DealFilter = any;
  export type MoveDealStage = any;
  export type Activity = any;
  export type CreateActivity = any;
  export type UpdateActivity = any;
  export type PaginationResponse = any;

  // Generic placeholder
  export type Placeholder = any;
}

declare module '@econeura/shared/logging' {
  export const logger: {
    info: (msg: string, meta?: any) => void;
    warn: (msg: string, meta?: any) => void;
    error: (msg: string, meta?: any) => void;
    debug: (msg: string, meta?: any) => void;
  };

  export const apiLogger: {
    logStartup: (msg: string, meta?: any) => void;
    logShutdown: (msg: string, meta?: any) => void;
  };
}
