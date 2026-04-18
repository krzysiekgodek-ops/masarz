import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.svg', 'bild/front.jpg'],
      manifest: {
        name: 'Masarski Master',
        short_name: 'Masarski',
        description: 'Rzemieślnicze narzędzia masarskie – receptury i kalkulator wsadu',
        theme_color: '#DC2626',
        background_color: '#F8FAFC',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache wszystkich zasobów aplikacji
        globPatterns: ['**/*.{js,css,html,png,svg,jpg,woff2}'],
        // Firebase Auth i Firestore — zawsze z sieci, fallback do cache
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com/,
            handler: 'NetworkFirst',
            options: { cacheName: 'firebase-auth' },
          },
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com/,
            handler: 'NetworkFirst',
            options: { cacheName: 'firestore' },
          },
          {
            urlPattern: /^https:\/\/www\.masarz\.ebra\.pl/,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
