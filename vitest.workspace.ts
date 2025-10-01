import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  {
    extends: './vitest.config.ts',
    test: {
      include: ['apps/web/**/*.{test,spec}.ts?(x)'],
        environment: 'jsdom',
        exclude: ['.disabled-packages/**']
    }
  },
  {
    extends: './vitest.config.ts',
    test: {
        include: ['apps/api/**/*.{test,spec}.ts'],
        exclude: ['.disabled-packages/**']
    }
  },
  {
    extends: './vitest.config.ts',
    test: {
        include: ['packages/**/*.{test,spec}.ts'],
        exclude: ['.disabled-packages/**']
    }
  }
])
