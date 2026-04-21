import path from 'node:path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      include: ['registry/new-york/cron-builder/**/*.{ts,tsx}'],
      exclude: ['registry/new-york/cron-builder/cron-types.ts'],
    },
  },
})
