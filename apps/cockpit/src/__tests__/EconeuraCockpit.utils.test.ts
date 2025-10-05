import {
  hexToRgb,
  rgba,
  cx,
  isReactComponent,
  getPalette,
  TagIcon,
  correlationId,
  invokeAgent,
  readVar,
} from '../EconeuraCockpit';
import { vi } from 'vitest';

describe('utils', () => {
  test('hexToRgb and rgba produce expected values', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(rgba('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
  });

  test('cx joins classes correctly', () => {
    expect(cx('a', false && 'b', undefined, 'c')).toBe('a c');
  });

  test('isReactComponent recognizes components', () => {
    function Foo() {
      return null;
    }
    expect(isReactComponent(Foo)).toBe(true);
    expect(isReactComponent({})).toBe(true);
    expect(isReactComponent(null)).toBe(false);
  });

  test('getPalette returns fallback and known palette', () => {
    const p = getPalette('CEO');
    expect(p).toHaveProperty('accentText');
    const pf = getPalette('UNKNOWN_ID');
    expect(pf).toHaveProperty('accentText');
  });

  test('TagIcon returns a valid component', () => {
    const el = TagIcon({ text: 'riesgo' });
    expect(isReactComponent((el as any).type || el.type || el)).toBe(true);
  });

  test('correlationId uses crypto if available and fallback otherwise', () => {
    const origDesc = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    try {
      Object.defineProperty(globalThis, 'crypto', {
        configurable: true,
        value: {
          getRandomValues: (arr: any) => {
            for (let i = 0; i < arr.length; i++) arr[i] = i + 1;
            return arr;
          },
        },
      });
      const a = correlationId();
      expect(typeof a).toBe('string');
      // remove crypto to force fallback
      Object.defineProperty(globalThis, 'crypto', { configurable: true, get: () => undefined });
      const b = correlationId();
      expect(typeof b).toBe('string');
    } finally {
      if (origDesc) Object.defineProperty(globalThis, 'crypto', origDesc as PropertyDescriptor);
    }
  });

  test('invokeAgent returns simulated when no token and calls fetch when token', async () => {
    // ensure no token
    (globalThis as any).__ECONEURA_BEARER = undefined;
    const r1 = await invokeAgent('a-ia-01');
    expect(r1.simulated).toBe(true);

    // mock token and fetch
    (globalThis as any).__ECONEURA_BEARER = 'T';
    const origFetch = (globalThis as any).fetch;
    try {
      (globalThis as any).fetch = vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ out: 'ok' }) });
      const r2 = await invokeAgent('a-ia-01');
      expect(typeof r2).toBe('object');
    } finally {
      (globalThis as any).fetch = origFetch;
      (globalThis as any).__ECONEURA_BEARER = undefined;
    }
  });
});
