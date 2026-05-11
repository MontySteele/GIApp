import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['node_modules', 'dist', 'e2e/**/*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Floor thresholds guard against regressions while the coverage plan tracks
      // the longer-term 80%+ goal for high-value user flows.
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 65,
        lines: 70,
      },
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/index.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
