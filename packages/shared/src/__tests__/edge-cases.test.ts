import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ensureGraphEnv, requireGraphEnvOrThrow } from '../graph/env.guard';
import { setTransport, clearTransport, routedLogger } from '../logging';
// avoid static import of config (it triggers loadConfig at module init)

describe('env.guard edge cases', () => {
  const original = process.env.GRAPH_URL;
  afterEach(() => {
    process.env.GRAPH_URL = original;
  });

  it('requireGraphEnvOrThrow passes when process.env present', () => {
    process.env.GRAPH_URL = 'http://x';
    expect(ensureGraphEnv({})).toBe(true);
    expect(requireGraphEnvOrThrow({})).toBe(true);
  });

  it('requireGraphEnvOrThrow throws when missing', () => {
    delete process.env.GRAPH_URL;
    expect(() => requireGraphEnvOrThrow({})).toThrow('GRAPH env missing');
  });
});

describe('logging edge cases', () => {
  it('serializes Error, functions and circular refs and routes to transport', () => {
    const calls: any[] = [];
    setTransport({ log: (level, msg, meta) => calls.push({ level, msg, meta }) });

    const err = new Error('boom');
    routedLogger.info('info', err);

    const fn = function namedFn() {};
    routedLogger.warn('warn', fn);

    const a: any = { x: 1 };
    a.self = a;
    routedLogger.error('err', a);

    // Some transport calls should be recorded
    expect(calls.length).toBeGreaterThanOrEqual(3);
    clearTransport();
  });

  it('fallbacks if console.debug missing', () => {
    // Simulate missing console.debug
    const origDebug = console.debug;
    // @ts-ignore
    console.debug = undefined;
    const calls: any[] = [];
    setTransport({ log: (level, msg, meta) => calls.push({ level, msg, meta }) });
    routedLogger.debug('d', { x: 1 });
    clearTransport();
    // restore
    // @ts-ignore
    console.debug = origDebug;
  });
});

describe('config load errors and success', () => {
  const envBackup = { ...process.env };
  afterEach(() => {
    process.env = { ...envBackup };
    // dynamic reset to avoid importing module at top-level
    return import('../config').then(m => m.resetConfigCache()).catch(() => {});
  });

  it('loadConfig throws when required vars missing', () => {
    // clear required vars
    delete process.env.JWT_SECRET;
    delete process.env.ENCRYPTION_KEY;
    // import dynamically: module evaluation should throw due to missing vars
    return import('../config').then(
      () => {
        // if import unexpectedly succeeds, run reset and then assert loadConfig throws
        return import('../config').then(m => {
          m.resetConfigCache();
          expect(() => m.loadConfig()).toThrow();
        });
      },
      err => {
        expect(err && err.message).toMatch(/Failed to load configuration/);
      }
    );
  });
});
