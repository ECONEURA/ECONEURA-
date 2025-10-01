// Minimal Vitest setup used by .dev/cockpit tests
import '@testing-library/jest-dom';

import { afterEach } from 'vitest';

// Provide a small global cleanup if needed
afterEach(() => {
  // no-op cleanup placeholder
});

export {};
