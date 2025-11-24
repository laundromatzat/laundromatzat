import { defineConfig, configDefaults, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react() as unknown as Plugin],
  test: {
    environment: 'jsdom',
    setupFiles: [],
    exclude: [
      ...configDefaults.exclude,
      'tests/e2e/**',
    ],
  },
});
