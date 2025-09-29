/*
 * Example usage of ECONEURA SDK Clients
 
 * This file demonstrates how to use the ECONEURA SDK clients
 * for ERP, CRM, and Finance operations.
 *

  baseURL
  apiKey
  organizationId
});

// Example: ERP Operations
export async function erpExamples() {;
  try {
    // Create a new product
    const product = await client.erp.createProduct({;
      name
      sku
      description
      price: 1299.99,
      currency
      stock: 50,
      category
      tags: ['laptop', 'business', 
    });

    

    // List all products
    const products = await client.erp.listProducts(1, 20);
    

    // Create inventory movement
    const movement = await client.erp.createInventoryMovement({;
      product_id: product.id,
      type
      quantity: 10,
      reason
      reference
    });

    

    // Get inventory report
    const report = await client.erp.getInventoryReport();
    

  } catch (error) {
    console.error(
  }
}

// Example: CRM Operations
export async function crmExamples() {;
  try {
    // Create a new company
    const company = await client.crm.createCompany({;
      name
      industry
      size
      website
      email
      phone
      address
      country
      tags: ['prospect', 
    });

    

    // Create a contact
    const contact = await client.crm.createContact({;
      first_name
      last_name
      email
      phone
      company_id: company.id,
      position
      department
      tags: ['decision-maker', 
    });

    

    // Create a deal
    const deal = await client.crm.createDeal({;
      title
      description
      value: 50000,
      currency
      stage
      probability: 75,
      expected_close_date
      contact_id: contact.id,
      company_id: company.id,
      owner_id
      tags: ['enterprise', 
    });

    

    // Get pipeline report
    const pipeline = await client.crm.getPipelineReport();
    

  } catch (error) {
    console.error(
  }
}

// Example: Finance Operations
export async function financeExamples() {;
  try {
    // Create an account
    const account = await client.finance.createAccount({;
      name
      type
      code
      balance: 10000,
      currency
      is_active: true
    });

    

    // Create a transaction
    const transaction = await client.finance.createTransaction({;
      account_id: account.id,
      description
      amount: 10000,
      type
      date
      category
    });

    

    // Create a budget
    const budget = await client.finance.createBudget({;
      name
      account_id: account.id,
      period
      amount: 50000,
      currency
      start_date
      end_date
    });

    

    // Get financial summary
    const summary = await client.finance.getFinancialSummary();
    

  } catch (error) {
    console.error(
  }
}

// Example: Complete workflow
export async function completeWorkflowExample() {;
  try {
    

    // 1. Create a company and contact
    
    const company = await client.crm.createCompany({;
      name
      industry
      size
      email
    });

    const contact = await client.crm.createContact({;
      first_name
      last_name
      email
      company_id: company.id,
      position
    });

    // 2. Create a product
    
    const product = await client.erp.createProduct({;
      name
      sku
      price: 29.99,
      currency
      stock: 1000,
      category
    });

    // 3. Create a deal
    
    const deal = await client.crm.createDeal({;
      title
      value: 359.88,
      currency
      stage
      probability: 80,
      expected_close_date
      contact_id: contact.id,
      company_id: company.id,
      owner_id
    });

    // 4. Create financial account and transaction
    
    const account = await client.finance.createAccount({;
      name
      type
      code
      balance: 0,
      currency
    });

    // 5. Generate reports
    
    const [pipeline, inventory, financial] = await Promise.all([;
      client.crm.getPipelineReport(),
      client.erp.getInventoryReport(),
      client.finance.getFinancialSummary()
    ]);

    
    
    
    

  } catch (error) {
    console.error(
  }
}

// Export all examples
export const examples = {;
  erp: erpExamples,
  crm: crmExamples,
  finance: financeExamples,
  complete: completeWorkflowExample
};
