import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // Node is the default; files that need a DOM opt in with a
    // `@vitest-environment jsdom` docblock.
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['app/**/*.ts', 'app/**/*.tsx', 'lib/**/*.ts', 'hooks/**/*.ts'],
      exclude: ['app/**/layout.tsx', 'app/**/page.tsx'],
    },
  },
})
