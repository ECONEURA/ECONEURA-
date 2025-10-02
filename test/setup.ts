/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { fetch, Headers, Request, Response } from 'undici'

// Setup global test environment
// Tell React testing utilities that we're running in a React act()-capable environment
// This avoids the repeated warning: "The current testing environment is not configured to support act(...)"
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

beforeAll(async () => {
  // Global setup before all tests
  console.log('Setting up test environment...')

  // Provide fetch polyfill for Node environments used by tests
  if (typeof (globalThis as any).fetch === 'undefined') {
    ;(globalThis as any).fetch = fetch as unknown as any
    ;(globalThis as any).Headers = Headers as unknown as any
    ;(globalThis as any).Request = Request as unknown as any
    ;(globalThis as any).Response = Response as unknown as any
  }

  // Ensure minimal DOM globals exist so @testing-library/user-event can attach clipboard
  if (typeof (globalThis as any).document === 'undefined') {
    ;(globalThis as any).document = { createElement: () => ({}) } as any
  }
  if (typeof (globalThis as any).navigator === 'undefined') {
    ;(globalThis as any).navigator = { clipboard: undefined } as any
  }
})

afterAll(async () => {
  // Global cleanup after all tests
  console.log('Cleaning up test environment...')
})

beforeEach(async () => {
  // Setup before each test
})

afterEach(async () => {
  // Cleanup after each test
})