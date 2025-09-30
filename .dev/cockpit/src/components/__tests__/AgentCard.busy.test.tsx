import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect } from 'vitest'

import AgentCard from '../AgentCard'

describe('AgentCard busy state', () => {
  it('disables Ejecutar button when busy is true', () => {
    const agent = { id: 'a1', title: 'Agent Busy', desc: 'desc' }
    render(<AgentCard a={agent} busy={true} onRun={() => {}} />)
    const btn = screen.getByRole('button', { name: /Ejecutar/i })
    expect(btn).toBeDisabled()
  })
})
