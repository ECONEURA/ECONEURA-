// Test setup for packages/shared
// Ensure minimal env vars required by modules that validate on import
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

export {};
