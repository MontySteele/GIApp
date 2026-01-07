import { GACHA_RULES } from '@/lib/constants';
import type { BannerPityState, ComputedWishData, WishRecord } from '@/types';

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
    fatePoints: 0,
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

function sortWishesByTime(wishes: WishWithMetadata[]): WishWithMetadata[] {
  return [...wishes].sort((a, b) => {
    const timeDiff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    if (timeDiff !== 0) return timeDiff;

    const createdDiff =
      new Date(a.createdAt || a.timestamp).getTime() -
      new Date(b.createdAt || b.timestamp).getTime();
    if (createdDiff !== 0) return createdDiff;

    return a.id.localeCompare(b.id);
  });
}

function handleCharacterWish(
  wish: WishWithMetadata,
  state: BannerPityState,
  computed: Record<string, ComputedWishData>
) {
  const characterRules = GACHA_RULES.character;
  const pityCount = state.character.pity + 1;
  const wasGuaranteed = state.character.guaranteed;
  const triggeredRadiance =
    !wasGuaranteed &&
    typeof characterRules?.radianceThreshold === 'number' &&
    state.character.radiantStreak >= characterRules.radianceThreshold;

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
  const maxFatePoints = GACHA_RULES.weapon?.maxFatePoints ?? 2;
  const wasGuaranteed = state.weapon.fatePoints >= maxFatePoints;

  state.weapon.chartedWeapon = chartedWeapon;

  if (wish.rarity === 5) {
    const hitCharted = chartedWeapon ? wish.itemKey === chartedWeapon : false;
    const shouldReset = wasGuaranteed || hitCharted;

    computed[wish.id] = {
      pityCount,
      wasGuaranteed,
      won5050: null,
      triggeredRadiance: false,
    };

    if (chartedWeapon) {
      state.weapon.fatePoints = shouldReset
        ? 0
        : Math.min(maxFatePoints, state.weapon.fatePoints + 1);
    }

    state.weapon.pity = 0;
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
  const sortedWishes = sortWishesByTime(wishes);
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
