import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: { include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'], environment: 'jsdom', setupFiles: ['./src/test-setup.ts'] },
})
