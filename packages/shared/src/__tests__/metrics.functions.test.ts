import { describe, it, expect } from 'vitest';

import {
  metrics,
  recordRequest,
  recordError,
  recordDatabaseQuery,
  recordCacheOperation,
  recordAIMetrics,
  updateGauges,
  metricsMiddleware,
  getMetrics,
  resetMetrics,
  getHealthMetrics,
} from '../metrics';

describe('metrics functions smoke', () => {
  it('calls metrics helpers without throwing', async () => {
    // Call counters
    metrics.requestsTotal.inc();
    metrics.errorsTotal.inc();
    metrics.databaseQueriesTotal.observe();
    metrics.cacheHitsTotal.inc();
    metrics.cacheMissesTotal.inc();
    metrics.memoryUsage.set();
    metrics.requestDuration.observe();
    metrics.aiTokensUsed.inc();
    metrics.aiCostEur.inc();

    // Call helper functions
    recordRequest('GET', '/test', 200, 123);
    recordError('TypeError', '/test');
    recordDatabaseQuery('SELECT', 'users', 10);
    recordCacheOperation('redis', true);
    recordAIMetrics('gpt', 'completion', 50, 10, 0.01);
    updateGauges();

    // middleware should forward to next
    let called = false;
    const req: any = {};
    const res: any = {};
    const next = () => {
      called = true;
    };
    metricsMiddleware(req, res, next);
    expect(called).toBe(true);

    const m = await getMetrics();
    expect(typeof m).toBe('string');

    resetMetrics();
    const h = getHealthMetrics();
    expect(h).toBeTruthy();
  });
});
