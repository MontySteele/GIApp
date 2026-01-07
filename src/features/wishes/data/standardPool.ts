import type { BannerType } from '@/types';

const normalizeName = (name: string) => name.trim().toLowerCase();

const STANDARD_CHARACTERS = new Set(
  [
    'diluc',
    'jean',
    'keqing',
    'mona',
    'qiqi',
    'tighnari',
    'dehya',
  ].map(normalizeName)
);

const STANDARD_WEAPONS = new Set(
  [
    "amos' bow",
    'aquila favonia',
    'lost prayer to the sacred winds',
    'skyward atlas',
    'skyward blade',
    'skyward harp',
    'skyward pride',
    'skyward spine',
    "wolf's gravestone",
  ].map(normalizeName)
);

export const isStandardCharacter = (name: string): boolean =>
  STANDARD_CHARACTERS.has(normalizeName(name));

export const isStandardWeapon = (name: string): boolean =>
  STANDARD_WEAPONS.has(normalizeName(name));

export const resolveIsFeatured = (
  name: string,
  banner: BannerType,
  _itemType: 'character' | 'weapon',
  rarity: number
): boolean | undefined => {
  if (rarity !== 5) return undefined;

  if (banner === 'character' || banner === 'chronicled') {
    return isStandardCharacter(name) ? false : true;
  }

  if (banner === 'weapon') {
    return isStandardWeapon(name) ? false : true;
  }

  return undefined;
};
