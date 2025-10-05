// React import not required in tests (automatic JSX runtime)
import { test, expect, vi } from 'vitest';

// Mock react-dom/client before importing main so dynamic import resolves to this mock
vi.mock('react-dom/client', () => {
  return {
    createRoot: (el: HTMLElement) => ({
      render(_node: any) {
        const marker = document.createElement('div');
        marker.setAttribute('data-test-rendered', '1');
        el.appendChild(marker);
      },
    }),
  };
});

test('mountApp dynamic import resolves mocked react-dom/client and renders', async () => {
  const root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);

  // Ensure we are not relying on __TEST_CREATE_ROOT
  delete (globalThis as any).__TEST_CREATE_ROOT;

  const mod: any = await import('../main');
  const mount = mod.mountApp || (mod.default && mod.default.mountApp);
  if (typeof mount !== 'function') throw new Error('mountApp not found');

  await mount(root, true);

  expect(root.querySelector('[data-test-rendered]')).toBeTruthy();
});
