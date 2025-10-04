import { describe, it, expect, vi } from 'vitest';
import { ensureGraphEnv, requireGraphEnvOrThrow } from '../graph/env.guard';
import {
  logger,
  routedLogger,
  setTransport,
  clearTransport,
  apiLogger,
  getLogLevel,
  setLogLevel,
} from '../logging';
import { createAIClient, parseAIResponse } from '../clients/ai-client';
import { estimateAICost, formatCostEur } from '../ai/cost-utils';

describe('env.guard', () => {
  it('ensureGraphEnv false when no env and empty vars', () => {
    expect(ensureGraphEnv({})).toBe(false);
  });
  it('ensureGraphEnv true when provided', () => {
    expect(ensureGraphEnv({ GRAPH_URL: 'http://x' })).toBe(true);
  });
  it('requireGraphEnvOrThrow throws when missing', () => {
    expect(() => requireGraphEnvOrThrow({})).toThrow();
  });
});

describe('ai client and cost utils', () => {
  it('ai client generate and parse', async () => {
    const c = createAIClient();
    const out = await c.generate('hi');
    expect(out.text).toContain('hi');
    expect(parseAIResponse(out)).toBe(out.text);
    expect(parseAIResponse(undefined)).toBe('');
  });

  it('estimateAICost and formatCostEur', () => {
    expect(estimateAICost(0)).toBe(0);
    expect(estimateAICost(100, 0.01)).toBe(1);
    expect(formatCostEur(123)).toBe('1.2300€');
  });
});

describe('logging helpers', () => {
  it('formatting and transport routing', () => {
    // simple transport spy
    const calls: any[] = [];
    setTransport({ log: (level, msg, meta) => calls.push({ level, msg, meta }) });
    routedLogger.info('hi', { x: 1 });
    routedLogger.warn('w', null);
    routedLogger.error('e');
    expect(calls.length).toBeGreaterThanOrEqual(3);
    clearTransport();
  });

  it('apiLogger shims to routedLogger', () => {
    const calls: any[] = [];
    setTransport({ log: (level, msg, meta) => calls.push({ level, msg, meta }) });
    apiLogger.logStartup('start', { a: 1 });
    apiLogger.logShutdown('stop', { b: 2 });
    expect(calls.length).toBe(2);
    clearTransport();
  });

  it('log level getters/setters', () => {
    const orig = getLogLevel();
    setLogLevel('info');
    expect(getLogLevel()).toBe('info');
    setLogLevel('debug');
    expect(getLogLevel()).toBe('debug');
    setLogLevel(orig);
  });
});
