import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateEmail, validateUUID, validateData } from '../validation.js';

describe('Validation Module', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
      expect(validateEmail('test.email@subdomain.example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@.com')).toBe(false);
      expect(validateEmail('test..test@example.com')).toBe(false);
    });
  });

  describe('validateUUID', () => {
    it('should validate correct UUID v4 format', () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      expect(validateUUID(validUUID)).toBe(true);
    });

    it('should reject invalid UUID formats', () => {
      expect(validateUUID('')).toBe(false);
      expect(validateUUID('invalid')).toBe(false);
      expect(validateUUID('550e8400-e29b-41d4-a716')).toBe(false); // too short
      expect(validateUUID('550e8400-e29b-41d4-a716-446655440000-extra')).toBe(false); // too long
      expect(validateUUID('gggggggg-e29b-41d4-a716-446655440000')).toBe(false); // invalid chars
    });
  });

  describe('validateData', () => {
    it('should validate data against Zod schema successfully', () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().min(1).max(149)
      });

      const validData = { name: 'John', age: 25 };
      const result = validateData(schema, validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should return errors for invalid data', () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().min(1).max(149)
      });

      const invalidData = { name: '', age: -5 };
      const result = validateData(schema, invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toBeDefined();
        expect(Array.isArray(result.errors)).toBe(true);
      }
    });

    it('should handle simple schemas', () => {
      const schema = z.string().email();

      const validResult = validateData(schema, 'test@example.com');
      expect(validResult.success).toBe(true);
      if (validResult.success) {
        expect(validResult.data).toBe('test@example.com');
      }

      const invalidResult = validateData(schema, 'invalid');
      expect(invalidResult.success).toBe(false);
      if (!invalidResult.success) {
        expect(invalidResult.errors).toBeDefined();
      }
    });

    it('should validate with custom error messages', () => {
      const schema = z.string().refine(validateEmail, 'Invalid email format');

      const result = validateData(schema, 'invalid');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toBeDefined();
      }
    });
  });
});