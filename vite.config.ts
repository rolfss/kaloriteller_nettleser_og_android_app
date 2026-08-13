import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'kaloriteller_nettleser_og_android_app'
const siteBase = process.env.GITHUB_PAGES === 'true' ? `/${repositoryName}/` : '/'

export default defineConfig({
  base: siteBase,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Kaloriteller',
        short_name: 'Kaloriteller',
        description: 'En enkel, lokal kaloriteller som aldri gjetter.',
        theme_color: '#153f37',
        background_color: '#f6f4ee',
        display: 'standalone',
        start_url: siteBase,
        scope: siteBase,
        lang: 'nb',
        categories: ['health', 'lifestyle'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    clearMocks: true,
  },
})
