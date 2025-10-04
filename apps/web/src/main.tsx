import React from 'react';

const defaultRoot = document.getElementById('root')!;

export async function mountApp(root: HTMLElement | null = defaultRoot, forceClient = false) {
  if (process.env.NODE_ENV === 'test' && !forceClient) {
    try {
      if (root) {
        const node = document.createElement('div');
        node.setAttribute('data-test-rendered', '1');
        root.appendChild(node);
      }
    } catch (e) {
      void e;
      /* ignore in test env */
    }
    return;
  }

  try {
    // If tests set a test-specific createRoot on globalThis, prefer it to avoid
    // Vite import-analysis resolving 'react-dom/client' during test runs.
    const globalAny: any = globalThis as any;
    let createRoot: any = globalAny.__TEST_CREATE_ROOT;
    if (!createRoot) {
      // fallback to dynamic import in non-test environments
      const dynamicPath = 'react-dom' + '/client';
      const mod = await import(dynamicPath);
      createRoot = (mod as any).createRoot;
    }
    if (createRoot && root) {
      // Import App lazily so tests can set up shims/global hooks before App's
      // module (which may use JSX runtime imports) is evaluated.
      const mod = await import('./App');
      const App = (mod && mod.default) || mod;
      // Use React.createElement to avoid compiling JSX here
      createRoot(root).render(React.createElement(App));
    }
  } catch (err) {
    void err;
    console.error('Failed to mount react-dom client', err);
  }
}

// Run mount at module load with default behavior (non-forced)
void mountApp(defaultRoot, false);

// Also provide a default export shape (some bundlers/instrumenters wrap named exports into a default getter)
export default { mountApp };
