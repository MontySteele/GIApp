import { useLiveQuery } from 'dexie-react-hooks';
import type { BannerType } from '@/types';
import { wishRepo } from '../repo/wishRepo';
import { getPityByBanner, getPityForBanner, type BannerPitySnapshot } from '../selectors/pitySelectors';

export function useCurrentPity(banner: BannerType): BannerPitySnapshot | null {
  const records = useLiveQuery(() => wishRepo.getAll(), []);

  if (!records) {
    return null;
  }

  return getPityForBanner(records, banner);
}

export function useAllCurrentPity(): Record<BannerType, BannerPitySnapshot> | null {
  const records = useLiveQuery(() => wishRepo.getAll(), []);

  if (!records) {
    return null;
  }

  return getPityByBanner(records);
}
