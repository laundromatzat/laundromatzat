import { defineConfig, configDefaults, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react() as unknown as Plugin],
  test: {
    environment: 'jsdom',
    setupFiles: [],
    exclude: [...configDefaults.exclude, 'tests/nylonFabricDesignerService.test.ts'],
    environmentMatchGlobs: [
      ['tests/server/**/*.test.ts', 'node'],
    ],
  },
});
