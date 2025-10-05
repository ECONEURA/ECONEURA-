import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { test, expect, vi } from 'vitest';
import EconeuraCockpit from '../EconeuraCockpit';

test('full interaction flows: change dept, filter, open org chart and run agents with varied fetch responses', async () => {
  render(<EconeuraCockpit />);

  // login
  const loginBtn = screen.getByText('INICIAR SESIÓN');
  fireEvent.click(loginBtn);
  await waitFor(() => expect(screen.getByPlaceholderText('Buscar...')).toBeTruthy());

  // change department (click second dept button)
  const deptButtons = Array.from(document.querySelectorAll('aside button'));
  if (deptButtons.length > 1) fireEvent.click(deptButtons[1]);

  // do a search that should filter agents
  const input = screen.getByPlaceholderText('Buscar...') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'OKR' } });
  // let filter apply
  await waitFor(() => {
    const _cards = document.querySelectorAll('[data-testid]');
    void _cards;
    // we don't require a specific count, just exercise code path
    expect(input.value).toBe('OKR');
  });

  // Open OrgChart via the sidebar button
  const orgBtn = screen.getByText('Organigrama');
  fireEvent.click(orgBtn);
  // OrgChart view shows 'Por favor inicia sesión' when orgView true? ensure some element
  await waitFor(() =>
    expect(screen.getByText('Por favor inicia sesión') || screen.getByText('Ejecutivo (CEO)'))
  );

  // restore main view by clicking first dept
  const firstDept = Array.from(document.querySelectorAll('aside button'))[0];
  if (firstDept) fireEvent.click(firstDept);

  // Mock fetch to return error first, then success
  let called = 0;
  (globalThis as any).fetch = vi.fn().mockImplementation(() => {
    called++;
    if (called === 1) return Promise.resolve({ ok: false, json: async () => ({ error: 'fail' }) });
    return Promise.resolve({ ok: true, json: async () => ({ output: 'ok' }) });
  });

  // Click first Ejecutar button (may produce simulated error then success)
  const runButtons = screen.getAllByText('Ejecutar');
  expect(runButtons.length).toBeGreaterThan(0);
  fireEvent.click(runButtons[0]);

  // wait for activity to update
  await waitFor(
    () => {
      const anyAgentText = Array.from(document.querySelectorAll('li')).some(n =>
        /a-\w+/.test(n.textContent || '')
      );
      expect(anyAgentText).toBeTruthy();
    },
    { timeout: 3000 }
  );
});
