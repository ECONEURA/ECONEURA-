import path from 'path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  esbuild: { sourcemap: true },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './apps/web/src'),
      '@shared': path.resolve(__dirname, './packages/shared/src'),
      '@econeura/shared': path.resolve(__dirname, './packages/shared/src'),
      '@econeura/db': path.resolve(__dirname, './packages/db/src'),
      '@econeura/sdk': path.resolve(__dirname, './packages/sdk/src')
    }
  },
  test: {
    environment: 'node',
    environmentMatchGlobs: [
      ['apps/web/**/*.test.{ts,js}', 'jsdom'],
      ['apps/web/**/*.spec.{ts,js}', 'jsdom']
    ],
    globals: true,
    setupFiles: ['./test/setup.ts'],
    reporters: ['default','json'],
    outputFile: { json: 'reports/vitest.json' },
    testTimeout: 8000,
    retry: 1,
    include: [
      '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'apps/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'packages/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '.disabled-packages/**',
      'dist/',
      'build/',
      '.next/',
      'coverage/',
      'test-results/',
      '**/*.config.{js,ts}',
      '**/*.d.ts',
      'packages/shared/src/__auto_tests__/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'packages/shared/src/**/*.{ts,js}',
        'apps/api/src/**/*.{ts,js}',
        'apps/web/src/**/*.{ts,js}'
      ],
      exclude: [
        'node_modules/',
        '**/*.test.{ts,js}',
        '**/*.spec.{ts,js}',
        '**/*.config.{ts,js}',
        '**/*.d.ts',
        'dist/',
        'build/',
        '.next/',
        'coverage/'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 60,
        statements: 80
      }
    }
  }
})
