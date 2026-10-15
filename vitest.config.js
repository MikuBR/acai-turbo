import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.js',
    include: ['src/tests/**/*.test.{js,jsx,ts,tsx}', 'src/tests/**/*.spec.{js,jsx,ts,tsx}'],
    coverage: {
      provider: 'v8',
      // 'lcov' é exigido pelo upload do Codecov no CI (./coverage/lcov.info)
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'src/store/**/*.{js,ts}',
        'src/components/atoms/**/*.{jsx,tsx}',
        'database/validate.cjs',
      ],
      exclude: [
        'src/tests/**',
        'node_modules/**',
      ],
    },
  },
})
