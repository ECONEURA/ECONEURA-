import { defineConfig } from 'vitest/config'
import path from 'path'

const local = (p: string) => path.resolve(__dirname, p)

export default defineConfig({
  resolve: {
    alias: {
      // Keep the lucide-react mock for tests; avoid forcing local React copies
      'lucide-react': local('__mocks__/lucide-react.ts')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts'
  }
})
