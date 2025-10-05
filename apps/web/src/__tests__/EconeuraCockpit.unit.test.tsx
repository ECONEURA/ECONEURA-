import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, test, vi, describe, it, expect } from 'vitest';
import EconeuraCockpit, { OrgChart } from '../EconeuraCockpit';

beforeEach(() => {
  // ensure clean globals between tests
  try {
    delete (globalThis as any).__ECONEURA_BEARER;
  } catch {}
  try {
    (globalThis as any).fetch = undefined;
  } catch {}
});

test('login, run agent (mocked fetch) and open chat', async () => {
  render(<EconeuraCockpit />);

  // login button should exist and clicking it dispatches auth:login
  const loginBtn = screen.getByText('INICIAR SESIÓN');
  expect(loginBtn).toBeTruthy();
  fireEvent.click(loginBtn);

  // after login event the search input should appear (authenticated true)
  await waitFor(() => expect(screen.getByPlaceholderText('Buscar...')).toBeTruthy());

  // mock a successful fetch response for invokeAgent
  (globalThis as any).fetch = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ output: 'ok-result' }) });

  // Find an Ejecutar button and click it to trigger runAgent
  const runButtons = screen.getAllByText('Ejecutar');
  expect(runButtons.length).toBeGreaterThan(0);
  fireEvent.click(runButtons[0]);

  // activity list should eventually contain an agent id or message
  await waitFor(
    () => {
      // look for an element that contains an agent id prefix 'a-'
      const anyAgentText = Array.from(document.querySelectorAll('li')).some(n =>
        /a-\w+/.test(n.textContent || '')
      );
      if (!anyAgentText) throw new Error('activity not populated yet');
    },
    { timeout: 3000 }
  );

  // Open chat and expect chat UI elements
  const chatBtn = screen.getByText('Abrir chat');
  fireEvent.click(chatBtn);
  // prefer the first matching 'Resumen del día' element
  const resumen = screen.getAllByText('Resumen del día')[0];
  expect(resumen).toBeTruthy();
});

test('OrgChart renders departments', () => {
  render(<OrgChart />);
  // Use generic assertions compatible across test environments
  expect(screen.getByText('Ejecutivo (CEO)')).toBeTruthy();
  expect(screen.getByText('Plataforma IA')).toBeTruthy();
});
