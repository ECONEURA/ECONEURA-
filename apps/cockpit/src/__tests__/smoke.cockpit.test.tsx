import React from 'react'
import { render, screen } from '@testing-library/react'
import EconeuraCockpit from '../EconeuraCockpit'

test('EconeuraCockpit smoke: renders header and key elements', () => {
  render(<EconeuraCockpit />)
  // Restrict selector to the visible span to avoid matching the SVG <title>
  expect(screen.getByText(/ECONEURA/i, { selector: 'span' })).toBeInTheDocument()
  // Ensure search input exists
  expect(screen.getByPlaceholderText(/Buscar/i)).toBeInTheDocument()
})
