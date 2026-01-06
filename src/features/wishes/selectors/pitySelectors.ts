import { GACHA_RULES } from '@/lib/constants';
import type { BannerType, WishRecord } from '@/types';
import { replayWishHistory } from '../domain/wishReplay';

export interface BannerPitySnapshot {
  banner: BannerType;
  pity: number;
  guaranteed: boolean;
  radiantStreak: number;
  radianceActive: boolean;
  fatePoints?: number;
}

const DEFAULT_STATE: Record<BannerType, BannerPitySnapshot> = {
  character: {
    banner: 'character',
    pity: 0,
    guaranteed: false,
    radiantStreak: 0,
    radianceActive: false,
  },
  weapon: {
    banner: 'weapon',
    pity: 0,
    guaranteed: false,
    radiantStreak: 0,
    radianceActive: false,
    fatePoints: 0,
  },
  standard: {
    banner: 'standard',
    pity: 0,
    guaranteed: false,
    radiantStreak: 0,
    radianceActive: false,
  },
  chronicled: {
    banner: 'chronicled',
    pity: 0,
    guaranteed: false,
    radiantStreak: 0,
    radianceActive: false,
  },
};

function createDefaultState(): Record<BannerType, BannerPitySnapshot> {
  return {
    character: { ...DEFAULT_STATE.character },
    weapon: { ...DEFAULT_STATE.weapon },
    standard: { ...DEFAULT_STATE.standard },
    chronicled: { ...DEFAULT_STATE.chronicled },
  };
}

function getRadianceActive(radiantStreak: number): boolean {
  const threshold = GACHA_RULES.character.radianceThreshold ?? 0;
  return GACHA_RULES.character.hasCapturingRadiance && radiantStreak >= threshold;
}

export function getPityByBanner(wishes: WishRecord[]): Record<BannerType, BannerPitySnapshot> {
  if (wishes.length === 0) {
    return createDefaultState();
  }

  const { pityState } = replayWishHistory(wishes);
  const weaponMaxFatePoints = GACHA_RULES.weapon.maxFatePoints ?? 2;
  const weaponGuaranteed = (pityState.weapon.fatePoints ?? 0) >= weaponMaxFatePoints;

  return {
    character: {
      banner: 'character',
      pity: pityState.character.pity,
      guaranteed: pityState.character.guaranteed,
      radiantStreak: pityState.character.radiantStreak,
      radianceActive: getRadianceActive(pityState.character.radiantStreak),
    },
    weapon: {
      banner: 'weapon',
      pity: pityState.weapon.pity,
      guaranteed: weaponGuaranteed,
      radiantStreak: 0,
      radianceActive: false,
      fatePoints: pityState.weapon.fatePoints,
    },
    standard: {
      banner: 'standard',
      pity: pityState.standard.pity,
      guaranteed: false,
      radiantStreak: 0,
      radianceActive: false,
    },
    chronicled: {
      banner: 'chronicled',
      pity: pityState.chronicled.pity,
      guaranteed: pityState.chronicled.guaranteed,
      radiantStreak: 0,
      radianceActive: false,
    },
  };
}

export function getPityForBanner(wishes: WishRecord[], bannerType: BannerType): BannerPitySnapshot {
  return getPityByBanner(wishes)[bannerType];
}
