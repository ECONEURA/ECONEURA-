import { describe, it, expect } from 'vitest';
import * as metricsModule from '../metrics';

describe('metrics smoke', () => {
  it('exports metrics object and helpers', async () => {
    expect(typeof metricsModule.metrics).toBe('object');
    // call helpers to ensure they don't throw
    metricsModule.recordRequest('GET', '/test', 200, 1);
    metricsModule.recordError('test', '/test');
    metricsModule.recordDatabaseQuery('select', 'table', 5);
    metricsModule.recordCacheOperation('redis', true);
    metricsModule.recordAIMetrics('gpt', 'call', 10, 5, 0.001);
    metricsModule.updateGauges();
    await metricsModule.getMetrics();
    metricsModule.resetMetrics();
    const health = metricsModule.getHealthMetrics();
    expect(typeof health).toBe('object');
  });
});
