// ...existing code...
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { __TEST_HELPERS } from '../EconeuraCockpit';

describe('EconeuraCockpit extra helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as any).__ECONEURA_BEARER;
  });

  afterEach(() => {
    delete (globalThis as any).__ECONEURA_BEARER;
    delete (globalThis as any).fetch;
  });

  it('iconForAgent returns a React component for varied titles', () => {
    const { iconForAgent, isReactComponent } = __TEST_HELPERS as any;
    const samples = [
      'Agente: Agenda Consejo',
      'Agente: OKR Agent',
      'Agente: Tendencias del sector',
      'Agente: Phishing Triage',
      'Agente: Email notifier',
    ];
    samples.forEach(s => {
      const I = iconForAgent(s);
      expect(isReactComponent(I)).toBeTruthy();
    });
  });

  it('getDeptIcon and getPalette return usable values', () => {
    const { getDeptIcon, getPalette, isReactComponent } = __TEST_HELPERS as any;
    const ids = ['CEO', 'IA', 'CSO', 'UNKNOWN'];
    ids.forEach(id => {
      const I = getDeptIcon(id);
      expect(isReactComponent(I)).toBeTruthy();
      const pal = getPalette(id);
      expect(pal).toHaveProperty('accentText');
      expect(pal).toHaveProperty('textHex');
    });
  });

  it('correlationId returns different strings', () => {
    const { correlationId } = __TEST_HELPERS as any;
    const a = correlationId();
    const b = correlationId();
    expect(typeof a).toBe('string');
    expect(a).not.toBe(b);
  });

  it('invokeAgent handles ok, not-ok and thrown fetch without throwing', async () => {
    const { invokeAgent } = __TEST_HELPERS as any;

    // Case: fetch resolves ok with JSON body
    (globalThis as any).__ECONEURA_BEARER = 'test-token';
    (globalThis as any).fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ output: 'OK-OUT' }),
    });
    const r1 = await invokeAgent('a-okr-01', {});
    expect(r1).toHaveProperty('ok');
    expect(r1.ok).toBe(true);
    expect(r1.output).toMatch(/OK-OUT/);

    // Case: fetch resolves but ok === false
    (globalThis as any).fetch = vi.fn().mockResolvedValueOnce({ ok: false });
    const r2 = await invokeAgent('a-unknown-01', {});
    // Implementation returns a simulated object when not ok
    expect(r2).toHaveProperty('ok');

    // Case: fetch throws (network error)
    (globalThis as any).fetch = vi.fn().mockRejectedValueOnce(new Error('net-fail'));
    const r3 = await invokeAgent('a-throw-01', {});
    expect(r3).toHaveProperty('ok');
  });
});
