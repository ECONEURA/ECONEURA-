// React is not required for automatic JSX runtime in tests
import { test, expect } from 'vitest';

// Provide a global test hook so the main module can avoid attempting to resolve
// 'react-dom/client' via Vite import-analysis which sometimes fails in the test runner.
(globalThis as any).__TEST_CREATE_ROOT = (el: any) => ({
  render: () => {
    const n = document.createElement('div');
    n.setAttribute('data-client-rendered', '1');
    el.appendChild(n);
  },
});

test('main client mount works when forced', async () => {
  const root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);

  const mod2: any = await import('../main');
  // Diagnostic: show what main exports under mocked react-dom/client

  console.log('DEBUG: main (client) exports', Object.keys(mod2));

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

  const mountApp2 = resolveMount(mod2);
  if (typeof mountApp2 !== 'function') {
    console.log('DEBUG: main (client) module shape', mod2);
    throw new Error('mountApp not exported after mock');
  }
  await mountApp2(root, true);
  expect(root.querySelector('[data-client-rendered]')).toBeTruthy();
});
