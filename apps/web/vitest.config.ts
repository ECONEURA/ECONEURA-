/// <reference types="vitest" />
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'module'

const req = createRequire(import.meta.url)
import { pathToFileURL } from 'url'

function normalize(p: string) {
  return p.replace(/\\/g, '/')
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({ jsxRuntime: 'classic' })],
  resolve: {
    alias: [
      { find: 'lucide-react', replacement: path.resolve(__dirname, '../../.dev/cockpit/__mocks__/lucide-react.ts') },
      // Ensure Vite can resolve react and its jsx runtimes in PNPM workspaces
  { find: 'react', replacement: normalize(req.resolve('react')) },
  // During tests, prefer local lightweight shims so transform-time imports
  // like 'react/jsx-dev-runtime' don't fail to resolve due to PNPM linking.
  { find: /^react\/jsx-runtime$/, replacement: normalize(path.resolve(__dirname, 'test/shims/react-jsx-runtime.js')) },
  { find: /^react\/jsx-dev-runtime$/, replacement: normalize(path.resolve(__dirname, 'test/shims/react-jsx-dev-runtime.js')) },
  { find: 'react-dom', replacement: normalize(req.resolve('react-dom')) },
  { find: 'react-dom/client', replacement: normalize(req.resolve('react-dom/client')) }
    ]
  },
  optimizeDeps: {
    include: ['react/jsx-runtime', 'react/jsx-dev-runtime', 'react', 'react-dom']
  },
  ssr: {
    noExternal: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime']
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [path.resolve(__dirname, 'src/test/setup.ts')],
  // Ignore generated/compiled JS test files and E2E test artifacts
  // so TSX sources are used by Vitest and disabled E2E files won't fail the run.
  exclude: ['**/*.test.js', '**/*.spec.js', '**/*.e2e.*'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'test/shims/**',
        'dist/**',
        '.eslintrc.cjs',
        '**/*.repo.*'
      ],
      thresholds: {
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60
        }
      }
    }
  }
})