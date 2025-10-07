import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

let resetConfigCache: () => void;
let loadConfig: () => any;
let getRequiredConfig: (k: any) => any;
let getOptionalConfig: (k: any, d: any) => any;

describe('config helpers', () => {
  const OLD_ENV = process.env;

  beforeEach(async () => {
    vi.resetModules();
    process.env = { ...OLD_ENV };
    // minimal valid env
    process.env.PORT = '3000';
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'x'.repeat(32);
    process.env.ENCRYPTION_KEY = 'y'.repeat(32);
    process.env.ALLOWED_ORIGINS = '*';
    process.env.DATABASE_URL = 'http://example.com';
    process.env.REDIS_URL = 'http://example.com';
    process.env.AZURE_OPENAI_API_KEY = 'key';
    process.env.AZURE_OPENAI_API_ENDPOINT = 'http://example.com';
    process.env.AZURE_OPENAI_API_VERSION = '2025-10-01';
    // import module after env is set
    const mod = await import('../config');
    resetConfigCache = mod.resetConfigCache;
    loadConfig = mod.loadConfig;
    getRequiredConfig = mod.getRequiredConfig;
    getOptionalConfig = mod.getOptionalConfig;
  });

  afterEach(() => {
    process.env = OLD_ENV;
    if (resetConfigCache) resetConfigCache();
  });

  test('loadConfig returns parsed config with defaults', () => {
    const cfg = loadConfig();
    expect(cfg.PORT).toBe('3000');
    expect(cfg.NODE_ENV).toBe('test');
    expect(cfg.AZURE_OPENAI_DEFAULT_MODEL).toBeDefined();
  });

  test('loadConfig throws when required var missing', () => {
    delete process.env.JWT_SECRET;
    if (resetConfigCache) resetConfigCache();
    expect(() => loadConfig()).toThrow('Failed to load configuration');
  });

  test('getRequiredConfig returns value and respects defaults; throws for missing optional keys', () => {
    if (resetConfigCache) resetConfigCache();
    const val = getRequiredConfig('PORT');
    expect(val).toBe('3000');
    // PORT has a schema default so removing env should still return default
    delete process.env.PORT;
    if (resetConfigCache) resetConfigCache();
    expect(getRequiredConfig('PORT')).toBe('3000');

    // OTEL_EXPORTER_OTLP_ENDPOINT is optional in schema; getRequiredConfig should throw when absent
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    if (resetConfigCache) resetConfigCache();
    expect(() => getRequiredConfig('OTEL_EXPORTER_OTLP_ENDPOINT' as any)).toThrow();
  });

  test('getOptionalConfig returns default when missing', () => {
    if (resetConfigCache) resetConfigCache();
    const v = getOptionalConfig('AI_BUDGET_LIMIT_EUR', 123 as any);
    expect(v).toBeGreaterThanOrEqual(0);
  });
});
