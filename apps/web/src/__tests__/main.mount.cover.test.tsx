import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mountApp } from '../main';

describe('mountApp', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
    // ensure test-mode by default
    process.env.NODE_ENV = 'test';
  });
  afterEach(() => {
    // cleanup any global shims
    // @ts-ignore
    delete (globalThis as any).__TEST_CREATE_ROOT;
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    // restore env
    process.env.NODE_ENV = '';
  });

  it('uses provided __TEST_CREATE_ROOT and calls render when forceClient=true', async () => {
    const render = vi.fn();
    // @ts-ignore
    globalThis.__TEST_CREATE_ROOT = (rootEl: HTMLElement) => ({ render });

    await mountApp(root, true);

    expect(render).toHaveBeenCalled();
  });

  it('when NODE_ENV=test and forceClient=false appends a test marker node', async () => {
    // default env is 'test' in this suite
    await mountApp(root, false);
    const node = root.querySelector('[data-test-rendered]');
    expect(node).not.toBeNull();
  });
});
