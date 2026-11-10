import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

// Os pacotes entram pelo FONTE: o `dist` deles é CommonJS (feito para a API). Mesmo esquema do Jottape.
const alias = {
  '@': path.resolve(__dirname, './src'),
  '@hortifruit/core': path.resolve(__dirname, '../../packages/core/src'),
  '@hortifruit/schemas': path.resolve(__dirname, '../../packages/schemas/src'),
};

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // PWA: instalável no celular (tela inicial) e com o app em cache. Só o "casco" (JS, CSS, fontes,
    // ícones, ilustrações) vai para o cache; /api e /uploadthing sempre vão para a rede, porque
    // preço, semana e pedido precisam estar atualizados. server.mjs manda sw.js, registerSW.js e
    // manifest.webmanifest sem cache, então um deploy novo chega na próxima abertura do app.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      manifest: {
        id: '/',
        name: 'Morro Verde Hortifruti',
        short_name: 'Morro Verde',
        description: 'Pedidos semanais de hortifruti da Morro Verde.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#003818',
        background_color: '#f6f3ea',
        categories: ['food', 'shopping', 'business'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          { name: 'Meus pedidos', url: '/meus-pedidos' },
          { name: 'Painel ADM', url: '/admin' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,svg,png}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api(\/|$)/, /^\/uploadthing(\/|$)/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
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
