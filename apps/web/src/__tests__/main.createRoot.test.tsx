import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('main.tsx mountApp createRoot branch', () => {
  beforeEach(() => {
    // ensure a clean module cache so dynamic import re-evaluates module code
    vi.resetModules();
    document.body.innerHTML = '<div id="root"></div>';
  });

  it('uses global __TEST_CREATE_ROOT when forceClient=true', async () => {
    const renderMock = vi.fn();
    const createRootMock = vi.fn(() => ({ render: renderMock }));

    // expose createRoot on globalThis before importing module
    (globalThis as any).__TEST_CREATE_ROOT = createRootMock;

    const mod = await import('../main');
    // resolve mountApp whether it's a named export or nested under default
    const mount = (mod as any).mountApp ?? (mod as any).default?.mountApp ?? (mod as any).default;
    expect(typeof mount).toBe('function');
    // call mountApp explicitly with forceClient to exercise dynamic createRoot path
    await (mount as any)(document.getElementById('root'), true);

    expect(createRootMock).toHaveBeenCalled();
    expect(renderMock).toHaveBeenCalled();
  });

  it('in test env without forceClient appends a test node', async () => {
    vi.resetModules();
    document.body.innerHTML = '<div id="root"></div>';
    // ensure no createRoot present
    delete (globalThis as any).__TEST_CREATE_ROOT;

    const mod = await import('../main');
    const mount = (mod as any).mountApp ?? (mod as any).default?.mountApp ?? (mod as any).default;
    expect(typeof mount).toBe('function');
    // mountApp called at module load with default args, but calling explicit to validate behavior
    await (mount as any)(document.getElementById('root'), false);
    const root = document.getElementById('root')!;
    const appended = root.querySelector('[data-test-rendered]');
    expect(appended).not.toBeNull();
  });
});
