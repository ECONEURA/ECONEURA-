import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  validateEmail,
  validateUUID,
  validatePositiveNumber,
  validateNonEmptyString,
  validateData,
} from '../validation';

describe('validation helpers', () => {
  it('validateEmail accepts valid and rejects invalid', () => {
    expect(validateEmail('a@b.com')).toBe(true);
    expect(validateEmail('not-an-email')).toBe(false);
  });

  it('validateUUID works', () => {
    expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(validateUUID('1234')).toBe(false);
  });

  it('validatePositiveNumber and nonEmptyString', () => {
    expect(validatePositiveNumber(3)).toBe(true);
    expect(validatePositiveNumber(-1)).toBe(false);
    expect(validateNonEmptyString('x')).toBe(true);
    expect(validateNonEmptyString('')).toBe(false);
  });

  it('validateData returns success or errors', () => {
    const schema = z.object({ a: z.string() });
    const ok = validateData(schema, { a: 'x' });
    expect((ok as any).success).toBe(true);

    const bad = validateData(schema, { a: 1 });
    expect((bad as any).success).toBe(false);
    expect((bad as any).errors.length).toBeGreaterThan(0);
  });
});
