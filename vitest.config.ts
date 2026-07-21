import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['proxy/**/*.test.ts', 'management/**/*.test.ts', 'shared/**/*.test.ts'],
    passWithNoTests: true,
    coverage: {
      provider: 'istanbul',
      reporter: [['text', { file: 'coverage.txt' }], ['json'], ['json-summary'], ['lcov']],
      reportsDirectory: 'coverage',
      include: ['proxy/**/*.ts', 'management/**/*.ts'],
      exclude: ['**/index.ts', '**/config.ts', '**/env.ts'],
    },
  },
})
