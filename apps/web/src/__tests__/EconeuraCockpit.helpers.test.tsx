import React from 'react';
import { describe, it, expect } from 'vitest';
import { __TEST_HELPERS as H, OrgChart } from '../EconeuraCockpit';
import { render } from '@testing-library/react';

describe('EconeuraCockpit helpers', () => {
  it('isReactComponent detects components and non-components', () => {
    expect(H.isReactComponent(() => null)).toBe(true);
    expect(H.isReactComponent({})).toBe(true); // object-like components (memo/forwardRef)
    expect(H.isReactComponent(null)).toBe(false);
  });

  it('getDeptIcon returns a component for known and unknown ids', () => {
    const K = H.getDeptIcon('CEO');
    expect(H.isReactComponent(K)).toBe(true);
    const U = H.getDeptIcon('UNKNOWN_ID');
    expect(H.isReactComponent(U)).toBe(true);
  });

  it('iconForAgent returns suitable icons for sample titles', () => {
    const iconA = H.iconForAgent('Agenda Consejo');
    const iconB = H.iconForAgent('Phishing Triage');
    expect(H.isReactComponent(iconA)).toBe(true);
    expect(H.isReactComponent(iconB)).toBe(true);
  });

  it('OrgChart renders and contains department names', () => {
    const { getByText } = render(<OrgChart />);
    // pick one known department
    expect(getByText(/Ejecutivo/)).toBeTruthy();
  });

  it('additional helpers and palettes work', async () => {
    const { iconForAgent, getDeptIcon, getPalette, isReactComponent, invokeAgent } = H as any;
    const I = iconForAgent('Agente: Agenda Consejo');
    expect(isReactComponent(I)).toBeTruthy();
    const Dept = getDeptIcon('CTO');
    expect(isReactComponent(Dept)).toBeTruthy();
    const pal = getPalette('IA');
    expect(pal).toBeDefined();
    expect(pal.accentText).toBeTruthy();

    // invokeAgent should simulate when no token is present
    delete (globalThis as any).__ECONEURA_BEARER;
    const res = await invokeAgent('a-okr-01', { input: 'x' });
    expect(res).toBeDefined();
    expect(res.ok).toBeTruthy();
    expect(res.output).toContain('Simulado');
  });
});
