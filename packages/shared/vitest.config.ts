import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    reporters: ['default', 'json'],
    outputFile: { json: 'reports/vitest.json' },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.ts'],
      // exclude tests, auto tests and type-only or generated folders that should not
      // count towards function/statement/line coverage
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/__auto_tests__/**',
        'src/schemas/**',
        'src/types/**'
      ]
    },
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', 'src/__auto_tests__/**']
  }
})