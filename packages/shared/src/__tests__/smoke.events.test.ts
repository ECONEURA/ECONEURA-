import { describe, it, expect } from 'vitest';

describe('events smoke', () => {
  it('can import events module', async () => {
    // Importing should not throw
    const events = await import('../events');
    expect(events).toBeDefined();
  });
});
