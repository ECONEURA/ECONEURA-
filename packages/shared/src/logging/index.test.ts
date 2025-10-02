import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import logger, { setLogLevel, getLogLevel } from './index';

describe('shared/logger', () => {
  let infoSpy: any;
  let warnSpy: any;
  let errorSpy: any;
  let debugSpy: any;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls console methods with message and meta', () => {
    logger.info('hello', { a: 1 });
    expect(infoSpy).toHaveBeenCalled();
    const args = infoSpy.mock.calls[0];
    expect(args[0]).toBe('hello');
    // meta was structured, should be present
    expect(args[1]).toEqual({ a: 1 });
  });

  it('serializes Error objects into plain objects', () => {
    const err = new Error('boom');
    logger.error('boom happened', err);
    expect(errorSpy).toHaveBeenCalled();
    const args = errorSpy.mock.calls[0];
    expect(args[0]).toBe('boom happened');
    // second arg should be an object with name and message
    expect(args[1]).toHaveProperty('name', 'Error');
    expect(args[1]).toHaveProperty('message', 'boom');
    // stack may be present
  });

  it('handles circular references gracefully', () => {
    const a: any = { name: 'a' };
    const b: any = { name: 'b', ref: a };
    a.ref = b;
    logger.warn('circular', a);
    expect(warnSpy).toHaveBeenCalled();
    const args = warnSpy.mock.calls[0];
    expect(args[0]).toBe('circular');
    // The serializer replaces circular refs with the string '[Circular]' somewhere in the structure
    const meta = args[1];
    // Should be an object and contain ref
    expect(meta).toBeDefined();
    // If circulars were stringified to '[Circular]' they might appear nested; a simple check:
    const foundCircular = JSON.stringify(meta).includes('[Circular]');
    expect(foundCircular).toBe(true);
  });

  it('respects log level filtering', () => {
    // Set to error only
    setLogLevel('error');
    expect(getLogLevel()).toBe('error');

    logger.info('should not appear', { a: 1 });
    logger.debug('should not appear');
    logger.warn('should not appear');
    logger.error('critical');

    expect(infoSpy).not.toHaveBeenCalled();
    expect(debugSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });
});
