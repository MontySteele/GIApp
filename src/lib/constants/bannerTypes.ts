/**
 * Banner Type Constants
 *
 * Genshin Impact gacha banner types.
 */

export const BANNER_TYPES = {
  CHARACTER: 'character',
  WEAPON: 'weapon',
  STANDARD: 'standard',
  CHRONICLED: 'chronicled',
} as const;

export type BannerType = typeof BANNER_TYPES[keyof typeof BANNER_TYPES];

export const BANNER_LABELS: Record<BannerType, string> = {
  [BANNER_TYPES.CHARACTER]: 'Character Event Wish',
  [BANNER_TYPES.WEAPON]: 'Weapon Event Wish',
  [BANNER_TYPES.STANDARD]: 'Standard Wish',
  [BANNER_TYPES.CHRONICLED]: 'Chronicled Wish',
};

export const BANNER_SHORT_LABELS: Record<BannerType, string> = {
  [BANNER_TYPES.CHARACTER]: 'Character',
  [BANNER_TYPES.WEAPON]: 'Weapon',
  [BANNER_TYPES.STANDARD]: 'Standard',
  [BANNER_TYPES.CHRONICLED]: 'Chronicled',
};
