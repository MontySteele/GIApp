import type { VitePWAOptions } from 'vite-plugin-pwa'

const appVersion = process.env.npm_package_version ?? '0.0.0'
const cachePrefix = `giapp-v${appVersion}`

const runtimeCaching: NonNullable<NonNullable<VitePWAOptions['workbox']>['runtimeCaching']> = [
  {
    urlPattern: /^https?:\/\/.*\.(?:png|jpg|jpeg|svg|webp|ico|woff2?|ttf|otf|css|js)$/i,
    handler: 'CacheFirst',
    options: {
      cacheName: `${cachePrefix}-static-assets`,
      cacheableResponse: {
        statuses: [0, 200]
      },
      expiration: {
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
      }
    }
  },
  {
    urlPattern: /^https?:\/\/(?:enka\.network|corsproxy\.io|[^/]*hoyoverse\.com|[^/]*mihoyo\.com)\/.*$/i,
    handler: 'NetworkFirst',
    options: {
      cacheName: `${cachePrefix}-imports-network-first`,
      networkTimeoutSeconds: 5,
      cacheableResponse: {
        statuses: [0, 200]
      },
    
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 // 24 hours
      }
    }
  }
]

export const pwaConfig: VitePWAOptions = {
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
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
      }
    ]
  },
  workbox: {
    cacheId: cachePrefix,
    cleanupOutdatedCaches: true,
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
    navigateFallback: '/offline.html',
    runtimeCaching
  }
}
