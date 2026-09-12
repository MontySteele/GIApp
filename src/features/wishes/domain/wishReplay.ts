import { GACHA_RULES } from '@/lib/constants';
import { isRadianceGuaranteed } from '@/lib/gacha/radiance';
import type { BannerPityState, ComputedWishData, WishRecord } from '@/types';
import { sortWishesChronologically } from './wishOrdering';

interface WishReplayOptions {
  chartedWeapon?: string | null;
}

type WishWithMetadata = WishRecord & {
  isFeatured?: boolean;
  chartedWeapon?: string | null;
};

export interface WishReplayResult {
  pityState: BannerPityState;
  computed: Record<string, ComputedWishData>;
}

const initialPityState: BannerPityState = {
  character: {
    pity: 0,
    guaranteed: false,
    radiantStreak: 0,
  },
  weapon: {
    pity: 0,
    guaranteed: false,
    fatePoints: 0,
    fatePointsUnknown: false,
    chartedWeapon: null,
  },
  standard: {
    pity: 0,
  },
  chronicled: {
    pity: 0,
    guaranteed: false,
  },
};

function handleCharacterWish(
  wish: WishWithMetadata,
  state: BannerPityState,
  computed: Record<string, ComputedWishData>
) {
  const characterRules = GACHA_RULES.character!;
  const pityCount = state.character.pity + 1;
  const wasGuaranteed = state.character.guaranteed;
  const triggeredRadiance =
    !wasGuaranteed && isRadianceGuaranteed(state.character.radiantStreak, characterRules);

  if (wish.rarity === 5) {
    const isFeatured = wish.isFeatured ?? true;
    const won5050 = wasGuaranteed ? null : isFeatured;

    computed[wish.id] = {
      pityCount,
      wasGuaranteed,
      won5050,
      triggeredRadiance,
    };

    state.character.pity = 0;

    if (!wasGuaranteed) {
      if (isFeatured) {
        state.character.radiantStreak = 0;
        state.character.guaranteed = false;
      } else {
        state.character.radiantStreak += 1;
        state.character.guaranteed = true;
      }
    } else {
      // Guaranteed featured pulls do not reset Capturing Radiance streak
      state.character.guaranteed = false;
    }

    return;
  }

  state.character.pity = pityCount;
}

function handleWeaponWish(
  wish: WishWithMetadata,
  state: BannerPityState,
  computed: Record<string, ComputedWishData>,
  chartedWeapon: string | null
) {
  const pityCount = state.weapon.pity + 1;
  const maxFatePoints = GACHA_RULES.weapon?.maxFatePoints ?? 1;
  // "Guaranteed" for the computed row means the charted weapon was forced by Epitomized Path.
  const wasGuaranteed = state.weapon.fatePoints >= maxFatePoints;

  state.weapon.chartedWeapon = chartedWeapon;

  if (wish.rarity === 5) {
    // isFeatured on weapon records means "is a rate-up weapon" (not in the standard pool).
    const isRateUp = wish.isFeatured ?? true;
    const hitCharted = chartedWeapon ? wish.itemKey === chartedWeapon : null;

    computed[wish.id] = {
      pityCount,
      wasGuaranteed,
      won5050: wasGuaranteed ? null : isRateUp,
      triggeredRadiance: false,
    };

    state.weapon.pity = 0;

    if (wasGuaranteed || hitCharted === true) {
      // Got the charted weapon: Epitomized Path resets, 75/25 guarantee consumed.
      state.weapon.fatePoints = 0;
      state.weapon.guaranteed = false;
      state.weapon.fatePointsUnknown = false;
      return;
    }

    if (!isRateUp) {
      // Lost the 75/25 to a standard weapon: +1 fate point, next 5★ is a rate-up weapon.
      state.weapon.fatePoints = Math.min(maxFatePoints, state.weapon.fatePoints + 1);
      state.weapon.guaranteed = true;
      return;
    }

    // Rate-up weapon that was not (or not known to be) the charted one.
    state.weapon.guaranteed = false;
    if (hitCharted === false) {
      state.weapon.fatePoints = Math.min(maxFatePoints, state.weapon.fatePoints + 1);
    } else {
      // Charted weapon unknown: we cannot tell whether this reset or added a fate point.
      state.weapon.fatePointsUnknown = true;
    }
    return;
  }

  state.weapon.pity = pityCount;
}

function handleStandardWish(
  wish: WishWithMetadata,
  state: BannerPityState,
  computed: Record<string, ComputedWishData>
) {
  const pityCount = state.standard.pity + 1;

  if (wish.rarity === 5) {
    computed[wish.id] = {
      pityCount,
      wasGuaranteed: false,
      won5050: null,
      triggeredRadiance: false,
    };
    state.standard.pity = 0;
    return;
  }

  state.standard.pity = pityCount;
}

function handleChronicledWish(
  wish: WishWithMetadata,
  state: BannerPityState,
  computed: Record<string, ComputedWishData>
) {
  const pityCount = state.chronicled.pity + 1;
  const wasGuaranteed = state.chronicled.guaranteed;

  if (wish.rarity === 5) {
    const isFeatured = wish.isFeatured ?? true;
    const won5050 = wasGuaranteed ? null : isFeatured;

    computed[wish.id] = {
      pityCount,
      wasGuaranteed,
      won5050,
      triggeredRadiance: false,
    };

    state.chronicled.guaranteed = wasGuaranteed ? false : !isFeatured;
    state.chronicled.pity = 0;
    return;
  }

  state.chronicled.pity = pityCount;
}

export function replayWishHistory(
  wishes: WishWithMetadata[],
  options: WishReplayOptions = {}
): WishReplayResult {
  const sortedWishes = sortWishesChronologically(wishes);
  const computed: Record<string, ComputedWishData> = {};
  const pityState: BannerPityState = structuredClone(initialPityState);
  const chartedWeapon = options.chartedWeapon ?? null;

  for (const wish of sortedWishes) {
    switch (wish.bannerType) {
      case 'character':
        handleCharacterWish(wish, pityState, computed);
        break;
      case 'weapon':
        handleWeaponWish(wish, pityState, computed, wish.chartedWeapon ?? chartedWeapon);
        break;
      case 'standard':
        handleStandardWish(wish, pityState, computed);
        break;
      case 'chronicled':
        handleChronicledWish(wish, pityState, computed);
        break;
      default:
        break;
    }
  }

  return { pityState, computed };
}
