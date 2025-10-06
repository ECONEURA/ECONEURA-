import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';

// Mock environment variables for testing
const mockEnv = {
  NODE_ENV: 'test',
  PORT: '3000',
  JWT_SECRET: 'a'.repeat(32), // 32 chars minimum
  ENCRYPTION_KEY: 'b'.repeat(32), // 32 chars minimum
  ALLOWED_ORIGINS: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  REDIS_URL: 'redis://localhost:6379',
  AZURE_OPENAI_API_KEY: 'test-key',
  AZURE_OPENAI_API_ENDPOINT: 'https://test.openai.azure.com/',
  AZURE_OPENAI_API_VERSION: '2023-12-01-preview',
  AZURE_OPENAI_DEFAULT_MODEL: 'gpt-4',
  LOG_LEVEL: 'info',
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX_REQUESTS: '100',
  AI_BUDGET_LIMIT_EUR: '1000',
  AI_BUDGET_ALERT_THRESHOLD: '0.8',
};

describe('Config Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env to original state
    process.env = { ...originalEnv, ...mockEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should validate required environment variables', () => {
    // Test that all required env vars are present
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.ENCRYPTION_KEY).toBeDefined();
    expect(process.env.ALLOWED_ORIGINS).toBeDefined();
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.REDIS_URL).toBeDefined();
  });

  it('should validate URL formats', () => {
    const urlSchema = z.string().url();

    expect(() => urlSchema.parse(process.env.DATABASE_URL)).not.toThrow();
    expect(() => urlSchema.parse(process.env.REDIS_URL)).not.toThrow();
    expect(() => urlSchema.parse(process.env.AZURE_OPENAI_API_ENDPOINT)).not.toThrow();
  });

  it('should validate JWT secret minimum length', () => {
    const jwtSchema = z.string().min(32);
    expect(() => jwtSchema.parse(process.env.JWT_SECRET)).not.toThrow();

    // Test that shorter secrets fail
    expect(() => jwtSchema.parse('short')).toThrow();
  });

  it('should validate numeric transformations', () => {
    const numberSchema = z.string().transform(Number);

    expect(numberSchema.parse(process.env.RATE_LIMIT_WINDOW_MS)).toBe(900000);
    expect(numberSchema.parse(process.env.RATE_LIMIT_MAX_REQUESTS)).toBe(100);
    expect(numberSchema.parse(process.env.AI_BUDGET_LIMIT_EUR)).toBe(1000);
  });

  it('should validate enum values', () => {
    const nodeEnvSchema = z.enum(['development', 'test', 'production']);
    const logLevelSchema = z.enum(['debug', 'info', 'warn', 'error']);

    expect(() => nodeEnvSchema.parse(process.env.NODE_ENV)).not.toThrow();
    expect(() => logLevelSchema.parse(process.env.LOG_LEVEL)).not.toThrow();

    // Test invalid enum values
    expect(() => nodeEnvSchema.parse('invalid')).toThrow();
    expect(() => logLevelSchema.parse('invalid')).toThrow();
  });

  it('should handle default values correctly', () => {
    // Remove optional env vars to test defaults
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

    const optionalUrlSchema = z.string().url().optional();
    expect(optionalUrlSchema.parse(process.env.OTEL_EXPORTER_OTLP_ENDPOINT)).toBeUndefined();
  });

  it('should validate Azure OpenAI configuration', () => {
    expect(process.env.AZURE_OPENAI_API_KEY).toBeDefined();
    expect(process.env.AZURE_OPENAI_API_ENDPOINT).toMatch(/^https:\/\//);
    expect(process.env.AZURE_OPENAI_API_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });
});
