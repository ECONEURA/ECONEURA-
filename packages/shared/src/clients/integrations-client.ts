// Minimal integrations client placeholder
export function createIntegrationsClient() {
  return {
    listIntegrations: async () => [] as any[],
  };
}

export function hasIntegrations(list: any[]) {
  return Array.isArray(list) && list.length > 0;
}
