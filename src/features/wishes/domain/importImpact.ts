import type { BannerType } from '@/types';
import type { BannerPitySnapshot } from '../selectors/pitySelectors';

export const WISH_BANNER_LABELS: Record<BannerType, string> = {
  character: 'Character Event',
  weapon: 'Weapon Event',
  standard: 'Standard',
  chronicled: 'Chronicled Wish',
};

export interface BannerImportImpact {
  banner: BannerType;
  pityBefore: number;
  pityAfter: number;
  guaranteedBefore: boolean;
  guaranteedAfter: boolean;
  fatePointsBefore?: number;
  fatePointsAfter?: number;
}

export interface WishImportImpact {
  rows: BannerImportImpact[];
  activePullCampaigns: number;
}

export function getWishBannerLabel(banner: BannerType): string {
  return WISH_BANNER_LABELS[banner];
}

export function buildImportImpact(
  before: Record<BannerType, BannerPitySnapshot>,
  after: Record<BannerType, BannerPitySnapshot>,
  importedSummary: Record<BannerType, number>,
  activePullCampaigns: number
): WishImportImpact {
  const rows = (Object.keys(importedSummary) as BannerType[])
    .filter((banner) => importedSummary[banner] > 0)
    .map((banner) => ({
      banner,
      pityBefore: before[banner].pity,
      pityAfter: after[banner].pity,
      guaranteedBefore: before[banner].guaranteed,
      guaranteedAfter: after[banner].guaranteed,
      fatePointsBefore: before[banner].fatePoints,
      fatePointsAfter: after[banner].fatePoints,
    }));

  return { rows, activePullCampaigns };
}
