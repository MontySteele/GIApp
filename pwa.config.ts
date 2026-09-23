import type { VitePWAOptions } from 'vite-plugin-pwa'

const runtimeCaching: NonNullable<NonNullable<VitePWAOptions['workbox']>['runtimeCaching']> = [
  {
    urlPattern: /^https?:\/\/.*\.(?:png|jpg|jpeg|svg|webp|ico|woff2?|ttf|otf|css|js)$/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'static-assets',
      cacheableResponse: {
        statuses: [0, 200]
      },
      expiration: {
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
      }
    }
  }
  // Import APIs (Enka, HoYoverse) are deliberately not cached: responses can
  // carry authkeys or account data, and imports should always be fresh.
]

export const pwaConfig: VitePWAOptions = {
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon.png', 'mask-icon.svg'],
  manifest: {
    name: 'Genshin Progress Tracker',
    short_name: 'Genshin Tracker',
    description: 'Track your Genshin Impact progress, wish history, and plan future pulls',
    theme_color: '#1e293b',
    background_color: '#0f172a',
    display: 'standalone',
    icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  },
  workbox: {
    cleanupOutdatedCaches: true,
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
    runtimeCaching
  }
}
