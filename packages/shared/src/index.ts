// Package entrypoint for '@econeura/shared' during development/typechecking
export * from './core/index.js';
export { logger, apiLogger } from './logging/index.js';
// Provide a default export for compatibility with some consumers that import the
// package as a default; keep it minimal and explicit.
import { logger as _logger, apiLogger as _apiLogger } from './logging/index.js';
export default { logger: _logger, apiLogger: _apiLogger };
// (types re-exports are declared above once)

// Compatibility helper used across the workspace
export function env() {
	try {
		return (require('./config.js').config) as any;
	} catch {
		// Fallback to process.env in environments where config parsing isn't possible
		return process.env as any;
	}
}

// Re-export minimal type modules used by the SDK. Export explicit names to
// avoid duplicate symbol collisions during isolated module checks.
export type { LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse, LogoutRequest, MeResponse, SessionsResponse, PaginationResponse as PaginationResponseApi } from './types/api/index.js';
export type { Company, CreateCompany, UpdateCompany, CompanyFilter, Contact, CreateContact, UpdateContact, ContactFilter, Deal, CreateDeal, UpdateDeal, DealFilter, MoveDealStage, Activity, CreateActivity, UpdateActivity, PaginationResponse as PaginationResponseModel } from './types/models/index.js';
