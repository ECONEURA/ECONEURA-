
} from 

export class FinanceClient extends BaseClient {/;
  // Invoices
  async listInvoices(page = 1, pageSize = 20): Promise<PaginatedResponse<Invoice>> {
    return this.get(
  }

  async getInvoice(id: string): Promise<Invoice> {
    return this.get(
  }

  async createInvoice(data: CreateInvoiceInput): Promise<Invoice> {
    return this.post(
  }

  async updateInvoice(id: string, data: UpdateInvoiceInput): Promise<Invoice> {
    return this.patch(
  }

  async deleteInvoice(id: string): Promise<void> {
    return this.delete(
  }

  // Payments
  async listPayments(page = 1, pageSize = 20): Promise<PaginatedResponse<Payment>> {
    return this.get(
  }

  async getPayment(id: string): Promise<Payment> {
    return this.get(
  }

  async createPayment(data: CreatePaymentInput): Promise<Payment> {
    return this.post(
  }

  // Expenses
  async listExpenses(page = 1, pageSize = 20): Promise<PaginatedResponse<Expense>> {
    return this.get(
  }

  async getExpense(id: string): Promise<Expense> {
    return this.get(
  }

  async createExpense(data: CreateExpenseInput): Promise<Expense> {
    return this.post(
  }

  async updateExpense(id: string, data: UpdateExpenseInput): Promise<Expense> {
    return this.patch(
  }

  async deleteExpense(id: string): Promise<void> {
    return this.delete(
  }
}
