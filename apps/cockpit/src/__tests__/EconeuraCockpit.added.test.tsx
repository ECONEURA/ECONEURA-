import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EconeuraCockpit from '../EconeuraCockpit';

describe('EconeuraCockpit UI interactions (added)', () => {
  it('opens chat and shows error sample messages when clicking Abrir chat', async () => {
    render(<EconeuraCockpit />);

    const openBtn = await screen.findByRole('button', { name: /Abrir chat/i });
    fireEvent.click(openBtn);

    // The drawer should render dept name and the sample messages
    expect(await screen.findByText(/Chat/)).toBeTruthy();
    // Two repeated error messages should appear
    const messages = await screen.findAllByText(/Lo siento, ha ocurrido un error/);
    expect(messages.length).toBeGreaterThanOrEqual(2);
  });
});
