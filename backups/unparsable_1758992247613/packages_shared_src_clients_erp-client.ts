
} from 

export class ERPClient extends BaseClient {/;
  // Products
  async listProducts(page = 1, pageSize = 20): Promise<PaginatedResponse<Product>> {
    return this.get(
  }

  async getProduct(id: string): Promise<Product> {
    return this.get(
  }

  async createProduct(data: CreateProductInput): Promise<Product> {
    return this.post(
  }

  async updateProduct(id: string, data: UpdateProductInput): Promise<Product> {
    return this.patch(
  }

  async deleteProduct(id: string): Promise<void> {
    return this.delete(
  }

  // Inventory Movements
  async listInventoryMovements(page = 1, pageSize = 20): Promise<PaginatedResponse<InventoryMovement>> {
    return this.get(
  }

  async getInventoryMovement(id: string): Promise<InventoryMovement> {
    return this.get(
  }

  async createInventoryMovement(data: CreateInventoryMovementInput): Promise<InventoryMovement> {
    return this.post(
  }

  // Suppliers
  async listSuppliers(page = 1, pageSize = 20): Promise<PaginatedResponse<Supplier>> {
    return this.get(
  }

  async getSupplier(id: string): Promise<Supplier> {
    return this.get(
  }

  async createSupplier(data: CreateSupplierInput): Promise<Supplier> {
    return this.post(
  }

  async updateSupplier(id: string, data: UpdateSupplierInput): Promise<Supplier> {
    return this.patch(
  }

  async deleteSupplier(id: string): Promise<void> {
    return this.delete(
  }
}
