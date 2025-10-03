import { describe, it, expect, vi } from 'vitest';
import { __RUN_SELF_TESTS } from '../EconeuraCockpit';

describe('EconeuraCockpit self-tests runner', () => {
  it('calls console.warn when overrides produce failures', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // override LogoEconeura to return empty node (missing innerHTML) to force failure
    __RUN_SELF_TESTS({ LogoEconeura: () => ({ props: {} }) as any });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
