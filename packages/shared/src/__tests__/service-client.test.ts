import { describe, test, expect } from 'vitest';
import { createServiceClient } from '../clients/service-client';

describe('ServiceClient', () => {
  test('createServiceClient returns a client with stats and a mock request', async () => {
    const c = createServiceClient({ serviceType: 'api' });
    const stats = c.getStats();
    expect(stats.serviceType).toBe('api');
    const res = await c.request({ endpoint: '/ok', method: 'GET' });
    expect(res.success).toBe(true);
    expect(res.serviceId).toBe('mock-service');
  });
});
