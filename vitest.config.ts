import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    setupFiles: ['tests/setup-integration.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
})
