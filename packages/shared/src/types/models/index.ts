// Minimal CRM model types used by the SDK during typechecking.
// Consolidated minimal CRM model types used by the SDK during typechecking.
export type Company = { id?: string; name?: string; createdAt?: string };
export type CreateCompany = Partial<Company> & { name?: string };
export type UpdateCompany = Partial<Company>;
export type CompanyFilter = Record<string, any>;

export type Contact = { id?: string; name?: string; firstName?: string; lastName?: string; email?: string };
export type CreateContact = Partial<Contact> & { name?: string };
export type UpdateContact = Partial<Contact>;
export type ContactFilter = Record<string, any>;

export type Deal = { id?: string; title?: string; amount?: number | string };
export type CreateDeal = Partial<Deal> & { title?: string };
export type UpdateDeal = Partial<Deal>;
export type DealFilter = Record<string, any>;
export type MoveDealStage = any;

export type Activity = { id?: string; type?: string; entityId?: string };
export type CreateActivity = Partial<Activity> & { type?: string };
export type UpdateActivity = Partial<Activity>;

export type PaginationResponse = { cursor?: string | null; limit?: number; total?: number };

export function modelTypesAvailable() {
	return true
}