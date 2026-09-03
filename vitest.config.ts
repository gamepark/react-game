import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  },
  ssr: {
    // Inlined rather than left to Node's ESM loader, which refuses the directory imports these packages
    // ship ("Directory import ... is not supported").
    noExternal: ['@gamepark/rules-api', '@gamepark/react-client', 'es-toolkit']
  }
})
