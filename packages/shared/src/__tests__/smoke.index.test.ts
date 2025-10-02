import { describe, it, expect } from 'vitest';

// Use dynamic import inside the test to ensure we set env vars before the module
// that validates config is evaluated. Static imports can be hoisted by the test
// runner during collection and trigger config validation too early.

describe('shared index smoke', () => {
  it('provides default export and env helper', async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'x'.repeat(32);
    process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'y'.repeat(32);
    process.env.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '*';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'http://localhost';
    process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
    process.env.AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || 'fake-key';
    process.env.AZURE_OPENAI_API_ENDPOINT =
      process.env.AZURE_OPENAI_API_ENDPOINT || 'https://example.com';
    process.env.AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '1.0';

    const mod = await import('../index');
    expect(mod.default).toBeDefined();
    const e = mod.env();
    expect(e).toBeDefined();
  });
});
