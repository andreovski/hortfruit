import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Os pacotes entram pelo FONTE: o `dist` deles é CommonJS (feito para a API). Mesmo esquema do Jottape.
const alias = {
  '@': path.resolve(__dirname, './src'),
  '@hortifruit/core': path.resolve(__dirname, '../../packages/core/src'),
  '@hortifruit/schemas': path.resolve(__dirname, '../../packages/schemas/src'),
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Mesmo contrato da produção (server.mjs): /api/* vai para a API sem o prefixo.
    proxy: {
      '/api': {
        target: process.env.API_URL ?? 'http://localhost:3333',
        changeOrigin: true,
        rewrite: (url) => url.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    globals: true,
    restoreMocks: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}', 'server.test.ts'],
    testTimeout: 15_000,
    alias,
  },
});
