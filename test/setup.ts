/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { fetch, Headers, Request, Response } from 'undici';

// Setup global test environment
beforeAll(async () => {
  // Global setup before all tests
  console.log('Setting up test environment...');

  // Setup global fetch for Node.js environment
  if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = fetch as unknown as any;
  globalThis.Headers = Headers as unknown as any;
  globalThis.Request = Request as unknown as any;
  globalThis.Response = Response as unknown as any;
  }
});

afterAll(async () => {
  // Global cleanup after all tests
  console.log('Cleaning up test environment...');
});

beforeEach(async () => {
  // Setup before each test
});

afterEach(async () => {
  // Cleanup after each test
});