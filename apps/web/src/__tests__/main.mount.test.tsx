// React import not required in tests (automatic JSX runtime)
import { afterEach, beforeEach, test, expect } from 'vitest';

beforeEach(() => {
  delete (globalThis as any).__TEST_CREATE_ROOT;
});

afterEach(() => {
  delete (globalThis as any).__TEST_CREATE_ROOT;
});

const resolveMount = (m: any) => {
  if (!m) return undefined;
  if (typeof m.mountApp === 'function') return m.mountApp;
  if (m.default) {
    if (typeof m.default.mountApp === 'function') return m.default.mountApp;
    if (typeof m.default === 'function' && typeof (m.default as any).mountApp === 'function')
      return (m.default as any).mountApp;
    if (m.default.default && typeof m.default.default.mountApp === 'function')
      return m.default.default.mountApp;
  }
  try {
    for (const k of Object.keys(m)) {
      const v = m[k];
      if (v && typeof v.mountApp === 'function') return v.mountApp;
    }
  } catch (_e) {
    void _e;
  }
  return undefined;
};

test('mountApp uses __TEST_CREATE_ROOT when provided and calls render', async () => {
  const root = document.createElement('div');
  document.body.appendChild(root);

  let rendered: any = null;
  (globalThis as any).__TEST_CREATE_ROOT = (_el: HTMLElement) => ({
    render(node: any) {
      rendered = node;
    },
  });

  const mod: any = await import('../main');
  const mountApp = resolveMount(mod);
  if (typeof mountApp !== 'function') throw new Error('mountApp not found in module');
  await mountApp(root, true);

  expect(rendered).toBeTruthy();
});
