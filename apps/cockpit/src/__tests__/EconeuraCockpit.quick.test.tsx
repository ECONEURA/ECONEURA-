import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EconeuraCockpit from '../EconeuraCockpit';

describe('EconeuraCockpit quick interactions', () => {
  test('renders and opens chat, switches dept and runs an agent (simulated)', async () => {
    render(<EconeuraCockpit />);

    // should render top bar input
    const search = screen.getByPlaceholderText('Buscar...');
    expect(search).toBeInTheDocument();

    // open chat
    const abrir = screen.getByRole('button', { name: /Abrir chat/i });
    fireEvent.click(abrir);
    expect(await screen.findByText(/Chat/)).toBeInTheDocument();

    // close chat by clicking overlay (pick the "Resumen del día" that is inside the aside)
    const allResumen = screen.getAllByText(/Resumen del día/);
    const asideBtn = allResumen.find(el => el.closest('aside'));
    const overlay = asideBtn?.closest('aside')?.parentElement;
    if (overlay) fireEvent.click(overlay);

    // switch department to IA
    const btnIA = screen.getByRole('button', { name: /Plataforma IA/i });
    fireEvent.click(btnIA);

    // run first visible agent's Ejecutar button (simulated invokeAgent without token)
    const ejecutar = await screen.findAllByRole('button', { name: /Ejecutar/i });
    expect(ejecutar.length).toBeGreaterThan(0);
    fireEvent.click(ejecutar[0]);

    // activity should appear (simulated) - wait for the activity list to update
    await waitFor(() => expect(screen.getByText(/Actividad/)).toBeInTheDocument());
  }, 20000);
});
