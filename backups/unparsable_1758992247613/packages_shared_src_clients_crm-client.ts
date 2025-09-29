
  size?: 'startup' | 'small' | 'medium' | 'large' | 
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  country?: string;
  vat_number?: string;
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Deal {;
  id: string;
  title: string;
  description?: string;
  value: number;
  currency: string;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 
  probability: number;
  expected_close_date: string;
  contact_id?: string;
  company_id?: string;
  owner_id: string;
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {;
  id: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 
  subject: string;
  description?: string;
  contact_id?: string;
  company_id?: string;
  deal_id?: string;
  owner_id: string;
  scheduled_at?: string;
  completed_at?: string;
  status: 'pending' | 'completed' | 
  created_at: string;
  updated_at: string;
}

export interface Label {;
  id: string;
  name: string;
  color: string;
  type: 'contact' | 'company' | 'deal' | 
  created_at: string;
  updated_at: string;
}

// Input Types
export interface CreateContactInput {;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_id?: string;
  position?: string;
  department?: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateContactInput {;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company_id?: string;
  position?: string;
  department?: string;
  tags?: string[];
  notes?: string;
}

export interface CreateCompanyInput {;
  name: string;
  industry?: string;
  size?: 'startup' | 'small' | 'medium' | 'large' | 
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  country?: string;
  vat_number?: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateCompanyInput {;
  name?: string;
  industry?: string;
  size?: 'startup' | 'small' | 'medium' | 'large' | 
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  country?: string;
  vat_number?: string;
  tags?: string[];
  notes?: string;
}

export interface CreateDealInput {;
  title: string;
  description?: string;
  value: number;
  currency: string;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 
  probability: number;
  expected_close_date: string;
  contact_id?: string;
  company_id?: string;
  owner_id: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateDealInput {;
  title?: string;
  description?: string;
  value?: number;
  currency?: string;
  stage?: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 
  probability?: number;
  expected_close_date?: string;
  contact_id?: string;
  company_id?: string;
  owner_id?: string;
  tags?: string[];
  notes?: string;
}

export interface CreateActivityInput {;
  type: 'call' | 'email' | 'meeting' | 'task' | 
  subject: string;
  description?: string;
  contact_id?: string;
  company_id?: string;
  deal_id?: string;
  owner_id: string;
  scheduled_at?: string;
  status: 'pending' | 'completed' | 
}

export interface UpdateActivityInput {;
  type?: 'call' | 'email' | 'meeting' | 'task' | 
  subject?: string;
  description?: string;
  contact_id?: string;
  company_id?: string;
  deal_id?: string;
  owner_id?: string;
  scheduled_at?: string;
  completed_at?: string;
  status?: 'pending' | 'completed' | 
}

export interface CreateLabelInput {;
  name: string;
  color: string;
  type: 'contact' | 'company' | 'deal' | 
}

export interface UpdateLabelInput {;
  name?: string;
  color?: string;
  type?: 'contact' | 'company' | 'deal' | 
}

export class CRMClient extends BaseClient {/;
  // Contacts
  async listContacts(page = 1, pageSize = 20): Promise<PaginatedResponse<Contact>> {
    return this.get(
  }

  async getContact(id: string): Promise<Contact> {
    return this.get(
  }

  async createContact(data: CreateContactInput): Promise<Contact> {
    return this.post(
  }

  async updateContact(id: string, data: UpdateContactInput): Promise<Contact> {
    return this.patch(
  }

  async deleteContact(id: string): Promise<void> {
    return this.delete(
  }

  async searchContacts(query: string): Promise<Contact[]> {
    return this.get(
  }

  // Companies
  async listCompanies(page = 1, pageSize = 20): Promise<PaginatedResponse<Company>> {
    return this.get(
  }

  async getCompany(id: string): Promise<Company> {
    return this.get(
  }

  async createCompany(data: CreateCompanyInput): Promise<Company> {
    return this.post(
  }

  async updateCompany(id: string, data: UpdateCompanyInput): Promise<Company> {
    return this.patch(
  }

  async deleteCompany(id: string): Promise<void> {
    return this.delete(
  }

  async searchCompanies(query: string): Promise<Company[]> {
    return this.get(
  }

  // Deals
  async listDeals(page = 1, pageSize = 20): Promise<PaginatedResponse<Deal>> {
    return this.get(
  }

  async getDeal(id: string): Promise<Deal> {
    return this.get(
  }

  async createDeal(data: CreateDealInput): Promise<Deal> {
    return this.post(
  }

  async updateDeal(id: string, data: UpdateDealInput): Promise<Deal> {
    return this.patch(
  }

  async deleteDeal(id: string): Promise<void> {
    return this.delete(
  }

  async getDealsByStage(stage: string): Promise<Deal[]> {
    return this.get(
  }

  // Activities
  async listActivities(page = 1, pageSize = 20): Promise<PaginatedResponse<Activity>> {
    return this.get(
  }

  async getActivity(id: string): Promise<Activity> {
    return this.get(
  }

  async createActivity(data: CreateActivityInput): Promise<Activity> {
    return this.post(
  }

  async updateActivity(id: string, data: UpdateActivityInput): Promise<Activity> {
    return this.patch(
  }

  async deleteActivity(id: string): Promise<void> {
    return this.delete(
  }

  async getActivitiesByContact(contactId: string): Promise<Activity[]> {
    return this.get(
  }

  async getActivitiesByCompany(companyId: string): Promise<Activity[]> {
    return this.get(
  }

  // Labels
  async listLabels(type?: string): Promise<Label[]> {
    return this.get(
  }

  async getLabel(id: string): Promise<Label> {
    return this.get(
  }

  async createLabel(data: CreateLabelInput): Promise<Label> {
    return this.post(
  }

  async updateLabel(id: string, data: UpdateLabelInput): Promise<Label> {
    return this.patch(
  }

  async deleteLabel(id: string): Promise<void> {
    return this.delete(
  }

  // Reports
  async getPipelineReport(): Promise<{
    total_deals: number;
    total_value: number;
    deals_by_stage: Array<{ stage: string; count: number; value: number }>;
    conversion_rate: number;
  }> {
    return this.get(
  }

  async getActivityReport(startDate: string, endDate: string): Promise<{
    total_activities: number;
    activities_by_type: Array<{ type: string; count: number }>;
    completion_rate: number;
  }> {
    return this.get(
      params: { startDate, endDate } 
    });
  }
}
