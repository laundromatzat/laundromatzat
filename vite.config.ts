import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: proxy => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            const requestPath = req.url ?? '';
            const requiresAdminKey =
              requestPath.startsWith('/api/subscribers') || requestPath.startsWith('/api/updates');

            if (!requiresAdminKey) {
              return;
            }

            const hasAdminKey = Boolean(req.headers['x-api-key']);
            if (!hasAdminKey) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  error: 'Admin API key required. Provide the key in the `x-api-key` header.',
                }),
              );
              proxyReq.destroy();
            }
          });
        },
      },
    },
  },
});
