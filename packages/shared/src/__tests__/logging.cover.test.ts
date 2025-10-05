import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  logger,
  routedLogger,
  setTransport,
  clearTransport,
  setLogLevel,
  getLogLevel,
  apiLogger,
} from '../logging';

describe('shared logging', () => {
  beforeEach(() => {
    // ensure a deterministic log level
    setLogLevel('debug');
  });
  afterEach(() => {
    clearTransport();
    vi.restoreAllMocks();
  });

  it('formats meta objects including Error and circular refs', () => {
    const c: any = { a: 1 };
    c.self = c;
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('test', { x: 1 }, new Error('e'), c);
    expect(spy).toHaveBeenCalled();
  });

  it('routes through transport when set', () => {
    const calls: any[] = [];
    const transport = {
      log: (level: any, msg: any, meta: any) => calls.push({ level, msg, meta }),
    };
    setTransport(transport as any);
    routedLogger.warn('w', { k: 'v' });
    expect(calls.length).toBe(1);
    expect(calls[0].level).toBe('warn');
  });

  it('apiLogger calls routedLogger', () => {
    const spy = vi.spyOn(routedLogger, 'info').mockImplementation(() => {});
    apiLogger.logStartup('up', { pid: 1 });
    expect(spy).toHaveBeenCalled();
  });

  it('getLogLevel returns a string', () => {
    const lvl = getLogLevel();
    expect(typeof lvl).toBe('string');
  });
});
describe('logging coverage edge cases', () => {
  it('handles JSON.parse failure fallback path in formatMeta', () => {
    const calls: any[] = [];
    setTransport({ log: (level, msg, meta) => calls.push({ level, msg, meta }) });

    // Create an object that will stringify to non-JSON-compatible content
    const weird = {
      toJSON: () => {
        throw new Error('boom-json');
      },
    };

    // This should hit the try -> catch -> safeStringify fallback branch
    routedLogger.info('weird', weird as any);
    clearTransport();
    expect(calls.length).toBeGreaterThanOrEqual(1);
  });

  it('formats functions and fallback values', () => {
    const calls: any[] = [];
    setTransport({ log: (level, msg, meta) => calls.push({ level, msg, meta }) });

    const fn = function myFn() {};
    routedLogger.warn('fn', fn as any);

    const circular: any = { a: 1 };
    circular.self = circular;
    routedLogger.error('circ', circular);

    // Should have recorded two calls
    clearTransport();
    expect(calls.length).toBeGreaterThanOrEqual(2);
  });
});
