import { hexToRgb, rgba, getPalette, correlationId, invokeAgent } from '../EconeuraCockpit';

describe('EconeuraCockpit helpers (added)', () => {
  it('hexToRgb parses 6-digit and 3-digit hex', () => {
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('rgba returns rgba string with alpha', () => {
    const r = rgba('#000000', 0.5);
    expect(r).toContain('rgba(');
    expect(r).toContain('0.5');
  });

  it('getPalette returns a palette object and fallback works', () => {
    const p = getPalette('CEO');
    expect(p).toHaveProperty('accentText');
    const pf = getPalette('UNKNOWN_ID');
    expect(pf).toHaveProperty('accentText');
  });

  it('correlationId generates a string', () => {
    const id = correlationId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('invokeAgent returns simulated result when no token present', async () => {
    // ensure no token
    // @ts-ignore
    delete (globalThis as any).__ECONEURA_BEARER;
    const res = await invokeAgent('a-test-01', { input: 'x' });
    expect(res).toHaveProperty('simulated', true);
    expect(res.ok).toBeTruthy();
  });
});
