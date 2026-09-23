import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pwaConfig } from './pwa.config'

describe('VitePWA configuration', () => {
  it('never caches import API responses, which can carry authkeys', () => {
    const importUrls = [
      'https://public-operation-hk4e-sg.hoyoverse.com/gacha_info/api/getGachaLog?authkey=secret',
      'https://hk4e-api.mihoyo.com/event/gacha_info/api/getGachaLog?authkey=secret',
      'https://enka.network/api/uid/123456789',
      'https://corsproxy.io/?https://enka.network/api/uid/123456789',
    ]
    const patterns = (pwaConfig.workbox?.runtimeCaching ?? []).map((rule) => rule.urlPattern)

    for (const url of importUrls) {
      const matched = patterns.some((pattern) => pattern instanceof RegExp && pattern.test(url))
      expect(matched, url).toBe(false)
    }
  })

  it('ships every icon the manifest and includeAssets reference', () => {
    const manifest = pwaConfig.manifest || {}
    const files = [
      ...(manifest.icons ?? []).map((icon) => icon.src),
      ...(pwaConfig.includeAssets as string[]),
    ]

    for (const file of files) {
      expect(existsSync(resolve(__dirname, 'public', file)), file).toBe(true)
    }
  })
})
