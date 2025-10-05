import React from 'react';
import { test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EconeuraCockpit from '../EconeuraCockpit';

describe('EconeuraCockpit interactions to cover TagIcon and OrgChart', () => {
  beforeEach(() => {
    (globalThis as any).__ECONEURA_BEARER = 'test-token-1';
  });
  afterEach(() => {
    delete (globalThis as any).__ECONEURA_BEARER;
  });

  it('switches to IA and shows tags including consumo and errores', async () => {
    render(<EconeuraCockpit />);
    // Click on Plataforma IA in the sidebar
    const btn = screen.getByText(/Plataforma IA/);
    fireEvent.click(btn);
    // Expect at least one of the IA tags to be present
    await waitFor(() =>
      expect(
        screen.queryAllByText(/Consumo por modelo|Errores por proveedor/).length
      ).toBeGreaterThan(0)
    );
  });

  it('switches to CSO and shows tags including M&A or Tendencias', async () => {
    render(<EconeuraCockpit />);
    const btn = screen.getByText(/Estrategia \(CSO\)/);
    fireEvent.click(btn);
    // There are multiple elements with similar text; assert at least one is present
    await waitFor(() => expect(screen.queryAllByText(/M&A|Tendencias/).length).toBeGreaterThan(0));
  });

  it('opens OrgChart via Organigrama button', async () => {
    render(<EconeuraCockpit />);
    const orgBtn = screen.getByText(/Organigrama/);
    fireEvent.click(orgBtn);
    // OrgChart should render department names like Ejecutivo
    await waitFor(() => expect(screen.queryByText(/Ejecutivo/)).toBeTruthy());
  });
});
