/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // `@/` désigne src/, comme dans tsconfig.app.json. https://vite.dev/config/shared-options#resolve-alias
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    // En développement, /api part vers le backend FastAPI (le conteneur `backend` sous Docker).
    proxy: { '/api': process.env.API_URL ?? 'http://127.0.0.1:8000' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
