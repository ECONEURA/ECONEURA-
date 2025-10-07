// Minimal runtime helpers for integrations schemas
export function integrationsSchemasAvailable() {
  return true;
}

export function getIntegrationSchemaNames() {
  return ['slack', 'salesforce'];
}
