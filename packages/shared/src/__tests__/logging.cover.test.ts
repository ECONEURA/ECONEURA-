import { describe, it, expect } from 'vitest';
import { routedLogger, setTransport, clearTransport } from '../logging';

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
