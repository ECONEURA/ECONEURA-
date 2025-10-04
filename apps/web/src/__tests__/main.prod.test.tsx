import { test, expect } from 'vitest';

test('mountApp dynamic import path (non-test) uses shim createRoot and renders', async () => {
  // Force non-test path
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  const root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);

  // Provide a test shim for createRoot so main's dynamic import isn't required
  (globalThis as any).__TEST_CREATE_ROOT = (el: HTMLElement) => ({
    render(_v: any) {
      const marker = document.createElement('div');
      marker.setAttribute('data-test-rendered', '1');
      el.appendChild(marker);
    },
  });

  // Dynamically import main and call mountApp (module may export default with mountApp)
  const mod: any = await import('../main');
  const mount =
    mod.mountApp ||
    (mod.default && mod.default.mountApp) ||
    (mod.default && mod.default.default && mod.default.default.mountApp);
  if (typeof mount !== 'function') throw new Error('mountApp not found');

  await mount(root, false);

  // Expect the shim createRoot to have appended the marker
  expect(root.querySelector('[data-test-rendered]')).toBeTruthy();

  // restore env
  process.env.NODE_ENV = prev;
});
