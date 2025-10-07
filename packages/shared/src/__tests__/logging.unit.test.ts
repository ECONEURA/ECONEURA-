import { describe, test, expect, vi } from 'vitest';
import { logger, apiLogger } from '../logging';

describe('logging shim', () => {
  test('logger methods call console', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    logger.info('hello', { a: 1 });
    logger.warn('w');
    logger.error('e');
    logger.debug('d');

    expect(infoSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    expect(debugSpy).toHaveBeenCalled();

    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    debugSpy.mockRestore();
  });

  test('apiLogger uses logger.info', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    apiLogger.logStartup('start', { ok: true });
    apiLogger.logShutdown('end');
    expect(infoSpy).toHaveBeenCalled();
    infoSpy.mockRestore();
  });
});
