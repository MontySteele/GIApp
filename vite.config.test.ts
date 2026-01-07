import { pwaConfig } from './pwa.config'

describe('VitePWA configuration', () => {
  it('matches the expected workbox runtime caching settings', () => {
    expect(pwaConfig.workbox).toMatchInlineSnapshot(`
      {
        "cleanupOutdatedCaches": true,
        "globPatterns": [
          "**/*.{js,css,html,ico,png,svg,woff,woff2}",
        ],
        "runtimeCaching": [
          {
            "handler": "CacheFirst",
            "options": {
              "cacheName": "static-assets",
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
              "cacheName": "imports-network-first",
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
