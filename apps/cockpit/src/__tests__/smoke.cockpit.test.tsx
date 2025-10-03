import React from 'react'
import { render, screen } from '@testing-library/react'
import EconeuraCockpit from '../EconeuraCockpit'

test('EconeuraCockpit smoke: renders header and key elements', () => {
  render(<EconeuraCockpit />)
  // Restrict selector to the visible span to avoid matching the SVG <title>
  // Use Chai-style assertion (.to.exist) to work with the test environment
  expect(screen.getByText(/ECONEURA/i, { selector: 'span' })).to.exist
  // Ensure search input exists
  expect(screen.getByPlaceholderText(/Buscar/i)).to.exist
})
