import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'services/**/*.ts',
        'hooks/**/*.ts',
        'App.tsx',
        'types.ts'
      ],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.*',
        '**/*.d.ts',
        '**/*.test.*',
        'vitest.setup.ts'
      ],
      thresholds: {
        // Critical paths: services and hooks must have 80%+ coverage
        'services/**/*.ts': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        'hooks/**/*.ts': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});
