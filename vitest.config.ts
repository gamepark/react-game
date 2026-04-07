import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  },
  ssr: {
    noExternal: ['@gamepark/rules-api', 'es-toolkit']
  }
})
