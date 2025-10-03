import { describe, it, expect, vi } from 'vitest';
import { __RUN_SELF_TESTS } from '../EconeuraCockpit';

describe('__RUN_SELF_TESTS forced failure', () => {
  it('logs warning when overrides produce invalid components/palettes', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    __RUN_SELF_TESTS({
      iconForAgent: () => null,
      getDeptIcon: () => null,
      getPalette: () => ({}),
      LogoEconeura: () => ({ props: {} }),
    } as any);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
