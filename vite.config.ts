import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // GitHub Pages sert le site sous /calcul-magique/ : le workflow de déploiement passe BASE_PATH.
  // Les liens de l'app sont en hash (#/…), aucune redirection serveur n'est nécessaire.
  base: process.env.BASE_PATH ?? '/',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    // Sons et illustrations restent des fichiers (préchargés par le service worker) au lieu
    // d'alourdir le JavaScript de démarrage en base64.
    assetsInlineLimit: (file) => (/\.(ogg|mp3)$|characters\/.*\.svg$/.test(file) ? false : undefined),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'robots.txt'],
      manifest: {
        name: 'Calcul Magique',
        short_name: 'Calcul Magique',
        description: 'Des petits jeux pour devenir fort en calcul mental.',
        lang: 'fr',
        // start_url et scope suivent `base` (valeurs par défaut du plugin).
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fff8f0',
        theme_color: '#b9a3e3',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,ogg,mp3,json}'],
        // Relatif à l'emplacement du service worker : marche à la racine comme sous /calcul-magique/.
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node', // domain/ est pur ; les tests de composants déclarent jsdom
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**/*.ts'],
      exclude: ['src/domain/**/*.test.ts', 'src/domain/types.ts'],
      // PRD M1 : couverture de domain/ ≥ 90 %.
      thresholds: { lines: 90, statements: 90, functions: 90, branches: 90 },
    },
  },
});
