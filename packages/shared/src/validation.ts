import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format');

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const positiveNumberSchema = z.number().positive('Must be positive');

export const nonEmptyStringSchema = z.string().min(1, 'Cannot be empty');

// Validation helper functions
export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

export function validateUUID(uuid: string): boolean {
  return uuidSchema.safeParse(uuid).success;
}

export function validatePositiveNumber(num: unknown): boolean {
  return positiveNumberSchema.safeParse(num).success;
}

export function validateNonEmptyString(str: unknown): boolean {
  return nonEmptyStringSchema.safeParse(str).success;
}

// Generic validation wrapper
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError['errors'] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error.errors };
}