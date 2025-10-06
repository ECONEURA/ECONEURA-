import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';

import AgentCard from '../AgentCard';

describe('AgentCard', () => {
  it('renders title and primary action', () => {
    const agent = {
      id: 'agent-1',
      title: 'Agent Uno',
      desc: 'Prueba de agente',
    };

    render(<AgentCard a={agent} onRun={async () => {}} />);

    expect(screen.getByText(/Agent Uno/i)).toBeInTheDocument();
    // assuming the card renders a button or action with text 'Invocar' or similar
    // We look specifically for the primary action button labelled 'Ejecutar'
    const btn = screen.getByRole('button', { name: /Ejecutar/i });
    expect(btn).toBeInTheDocument();
  });
});
