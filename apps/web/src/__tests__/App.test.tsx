import React from 'react';
import { render, screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import App from '../App';

test('App renders EconeuraCockpit via App', () => {
  render(<App />);
  // ensure cockpit root text appears
  expect(screen.getByText('INICIAR SESIÓN')).toBeTruthy();
});
