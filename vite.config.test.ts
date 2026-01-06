import { pwaConfig } from './pwa.config'

describe('VitePWA configuration', () => {
  it('matches the expected workbox runtime caching settings', () => {
    expect(pwaConfig.workbox).toMatchInlineSnapshot(`
      {
        "cacheId": "giapp-v0.1.0",
        "cleanupOutdatedCaches": true,
        "globPatterns": [
          "**/*.{js,css,html,ico,png,svg,woff,woff2}",
        ],
        "navigateFallback": "/offline.html",
        "runtimeCaching": [
          {
            "handler": "CacheFirst",
            "options": {
              "cacheName": "giapp-v0.1.0-static-assets",
              "cacheableResponse": {
                "statuses": [
                  0,
                  200,
                ],
              },
              "expiration": {
                "maxAgeSeconds": 2592000,
                "maxEntries": 200,
              },
            },
            "urlPattern": /\\^https\\?:\\\\/\\\\/\\.\\*\\\\\\.\\(\\?:png\\|jpg\\|jpeg\\|svg\\|webp\\|ico\\|woff2\\?\\|ttf\\|otf\\|css\\|js\\)\\$/i,
          },
          {
            "handler": "NetworkFirst",
            "options": {
              "cacheName": "giapp-v0.1.0-imports-network-first",
              "cacheableResponse": {
                "statuses": [
                  0,
                  200,
                ],
              },
              "expiration": {
                "maxAgeSeconds": 86400,
                "maxEntries": 50,
              },
              "networkTimeoutSeconds": 5,
            },
            "urlPattern": /\\^https\\?:\\\\/\\\\/\\(\\?:enka\\\\\\.network\\|corsproxy\\\\\\.io\\|\\[\\^/\\]\\*hoyoverse\\\\\\.com\\|\\[\\^/\\]\\*mihoyo\\\\\\.com\\)\\\\/\\.\\*\\$/i,
          },
        ],
      }
    `)
  })
})
