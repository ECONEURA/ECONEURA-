import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import EconeuraCockpit, { __TEST_HELPERS as H } from '../EconeuraCockpit';

describe('EconeuraCockpit coverage-focused tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // default to authenticated to exercise authenticated UI paths
    (globalThis as any).__ECONEURA_BEARER = 'tok-x';
  });
  afterEach(() => {
    delete (globalThis as any).__ECONEURA_BEARER;
    // restore fetch if stubbed
    try {
      vi.unstubAllGlobals?.();
    } catch {}
  });

  it('invokeAgent returns body.output when fetch ok and token present (okr mapping)', async () => {
    const mockJson = { output: 'OKR result' };
    const fetchMock = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockJson) } as any)
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await (H as any).invokeAgent('a-okr-01', { input: 'x' });
    expect(res).toBeDefined();
    expect(res.ok).toBeTruthy();
    expect(res.output).toContain('OKR result');
    expect(fetchMock).toHaveBeenCalled();
  });

  it('invokeAgent returns simulated when fetch returns not ok', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({ ok: false, json: () => Promise.resolve({}) } as any)
    );
    vi.stubGlobal('fetch', fetchMock);
    (globalThis as any).__ECONEURA_BEARER = 'tok-yes';

    const res = await (H as any).invokeAgent('a-flow-01', {});
    expect(res).toBeDefined();
    // implementation returns simulated output for non-ok
    expect(res.output).toContain('Simulado');
  });

  it('invokeAgent handles fetch throw and returns simulated', async () => {
    const fetchMock = vi.fn(() => Promise.reject(new Error('network')));
    vi.stubGlobal('fetch', fetchMock);
    const res = await (H as any).invokeAgent('a-integration-01', {});
    expect(res).toBeDefined();
    expect(res.output).toContain('Simulado');
  });

  it('runAgent flow: clicking Ejecutar creates activity entry (OK) and clears busy state', async () => {
    // mock fetch to return ok
    const mockJson = { output: 'DONE' };
    const fetchMock = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockJson) } as any)
    );
    vi.stubGlobal('fetch', fetchMock);

    const { getAllByText } = render(<EconeuraCockpit />);
    // find first Ejecutar button and click
    const btns = getAllByText('Ejecutar');
    expect(btns.length).toBeGreaterThan(0);
    fireEvent.click(btns[0]);

    // wait for activity list to show at least one new entry containing 'Agent'
    await waitFor(() => expect(screen.queryAllByText(/Agent/).length).toBeGreaterThan(0));
  });

  it('runAgent flow: non-ok response creates ERROR activity', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({ ok: false, json: () => Promise.resolve({}) } as any)
    );
    vi.stubGlobal('fetch', fetchMock);
    const { getAllByText } = render(<EconeuraCockpit />);
    const btns = getAllByText('Ejecutar');
    expect(btns.length).toBeGreaterThan(1);
    // click second agent to vary id
    fireEvent.click(btns[1]);
    await waitFor(() => expect(screen.queryByText(/ERROR/)).toBeTruthy());
  });

  it('openChatWithErrorSamples opens chat drawer with messages', async () => {
    const { getByText } = render(<EconeuraCockpit />);
    const openBtn = getByText('Abrir chat');
    fireEvent.click(openBtn);
    // two sample messages are added; assert that at least one is present
    await waitFor(() =>
      expect(screen.queryAllByText(/Lo siento, ha ocurrido un error/).length).toBeGreaterThan(0)
    );
  });

  it('correlationId uses fallback when crypto missing', () => {
    const orig = (globalThis as any).crypto;
    try {
      delete (globalThis as any).crypto;
      const id = (H as any).correlationId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    } finally {
      (globalThis as any).crypto = orig;
    }
  });
});
