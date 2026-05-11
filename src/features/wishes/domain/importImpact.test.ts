import { describe, expect, it } from 'vitest';
import { buildImportImpact, getWishBannerLabel } from './importImpact';
import type { BannerType } from '@/types';
import type { BannerPitySnapshot } from '../selectors/pitySelectors';

function pity(banner: BannerType, overrides: Partial<BannerPitySnapshot> = {}): BannerPitySnapshot {
  return {
    banner,
    pity: 0,
    guaranteed: false,
    radiantStreak: 0,
    radianceActive: false,
    fatePoints: 0,
    ...overrides,
  };
}

const banners: BannerType[] = ['character', 'weapon', 'standard', 'chronicled'];

function byBanner(overrides: Partial<Record<BannerType, BannerPitySnapshot>> = {}) {
  return Object.fromEntries(
    banners.map((banner) => [banner, overrides[banner] ?? pity(banner)])
  ) as Record<BannerType, BannerPitySnapshot>;
}

describe('importImpact', () => {
  it('labels wish banner types for import UI copy', () => {
    expect(getWishBannerLabel('character')).toBe('Character Event');
    expect(getWishBannerLabel('weapon')).toBe('Weapon Event');
    expect(getWishBannerLabel('standard')).toBe('Standard');
    expect(getWishBannerLabel('chronicled')).toBe('Chronicled Wish');
  });

  it('builds impact rows only for imported banners', () => {
    const impact = buildImportImpact(
      byBanner({
        character: pity('character', { pity: 62, guaranteed: false }),
        weapon: pity('weapon', { pity: 28, fatePoints: 1 }),
      }),
      byBanner({
        character: pity('character', { pity: 13, guaranteed: true }),
        weapon: pity('weapon', { pity: 45, fatePoints: 2 }),
      }),
      {
        character: 8,
        weapon: 1,
        standard: 0,
        chronicled: 0,
      },
      2
    );

    expect(impact).toEqual({
      activePullCampaigns: 2,
      rows: [
        {
          banner: 'character',
          pityBefore: 62,
          pityAfter: 13,
          guaranteedBefore: false,
          guaranteedAfter: true,
          fatePointsBefore: 0,
          fatePointsAfter: 0,
        },
        {
          banner: 'weapon',
          pityBefore: 28,
          pityAfter: 45,
          guaranteedBefore: false,
          guaranteedAfter: false,
          fatePointsBefore: 1,
          fatePointsAfter: 2,
        },
      ],
    });
  });
});
