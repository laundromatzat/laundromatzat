import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: [],
    exclude: [...configDefaults.exclude, 'tests/nylonFabricDesignerService.test.ts'],
  },
});
