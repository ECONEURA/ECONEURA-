/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { fetch, Headers, Request, Response } from 'undici';

// Setup global test environment
beforeAll(async () => {
  // Global setup before all tests
  console.log('Setting up test environment...');

  // Provide fetch polyfill for Node environments used by tests
  if (typeof (globalThis as any).fetch === 'undefined') {
    ;(globalThis as any).fetch = fetch as unknown as any
    ;(globalThis as any).Headers = Headers as unknown as any
    ;(globalThis as any).Request = Request as unknown as any
    ;(globalThis as any).Response = Response as unknown as any
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