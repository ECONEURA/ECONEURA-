import { describe, it, expect } from 'vitest';

// Provide safe default env values so importing core modules that validate config
// does not crash in CI or local runs without secrets.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'x'.repeat(32);
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'y'.repeat(32);
process.env.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '*';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'http://localhost';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || 'fake-key';
process.env.AZURE_OPENAI_API_ENDPOINT =
  process.env.AZURE_OPENAI_API_ENDPOINT || 'https://example.com';
process.env.AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '1.0';

describe('core smoke', () => {
  it('can import core module and its re-exports', async () => {
    const core = await import('../core/index');
    expect(core).toBeDefined();
  });
});
