import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import routedLogger, { setTransport, clearTransport } from './index';

describe('shared/logger - transport', () => {
  let mockTransport: { log: any };

  beforeEach(() => {
    mockTransport = { log: vi.fn() };
  });

  afterEach(() => {
    clearTransport();
    vi.restoreAllMocks();
  });

  it('routes logs to the configured transport', () => {
    setTransport(mockTransport as any);
    routedLogger.info('tmsg', { x: 1 });
    routedLogger.warn('wmsg');
    routedLogger.error('emsg', new Error('boom'));
    routedLogger.debug('dmsg');

    expect(mockTransport.log).toHaveBeenCalled();
    const calls = mockTransport.log.mock.calls.map((c: unknown[]) => ({ level: c[0], msg: c[1] }));
    expect(
      calls.some((c: { level: string; msg: string }) => c.level === 'info' && c.msg === 'tmsg')
    ).toBe(true);
    expect(
      calls.some((c: { level: string; msg: string }) => c.level === 'warn' && c.msg === 'wmsg')
    ).toBe(true);
    expect(
      calls.some((c: { level: string; msg: string }) => c.level === 'error' && c.msg === 'emsg')
    ).toBe(true);
  });

  it('clearTransport restores console routing', () => {
    setTransport(mockTransport as any);
    routedLogger.info('with-transport');
    expect(mockTransport.log).toHaveBeenCalled();

    clearTransport();
    // After clearing, transport should not receive calls
    routedLogger.info('after-clear');
    // The mockTransport should not have been called for the second message
    const calls = mockTransport.log.mock.calls.map((c: unknown[]) => c[1]);
    expect(calls).not.toContain('after-clear');
  });
});
