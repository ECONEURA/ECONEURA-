import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 8080,
    strictPort: true,
    proxy: {
      // friendly local path for the mock AI server used by the cockpit preview
      '/dev-mock-ai': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/dev-mock-ai/, '/')
      }
    }
  },
  preview: { host: '127.0.0.1', port: 8080 }
})
