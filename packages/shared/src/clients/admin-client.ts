// Minimal admin client placeholder
export function createAdminClient(baseUrl = '') {
  return {
    baseUrl,
    ping: async () => ({ ok: true, url: baseUrl }),
  };
}

export async function adminHealth() {
  return { healthy: true };
}
