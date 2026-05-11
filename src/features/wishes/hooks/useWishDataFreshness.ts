import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  DEFAULT_WISH_STALE_AFTER_DAYS,
  getWishDataFreshness,
  getWishDataSnapshot,
  type WishDataFreshness,
} from '../services/wishDataFreshness';

export function useWishDataFreshness(staleAfterDays = DEFAULT_WISH_STALE_AFTER_DAYS): WishDataFreshness {
  const snapshot = useLiveQuery(() => getWishDataSnapshot(), []);

  return useMemo(
    () => {
      if (snapshot === undefined) {
        return {
          status: 'fresh',
          isLoading: true,
          lastUpdatedAt: null,
          daysSinceUpdate: null,
          label: 'Checking wish history',
          detail: '',
        } satisfies WishDataFreshness;
      }

      return getWishDataFreshness(snapshot, new Date(), staleAfterDays);
    },
    [snapshot, staleAfterDays]
  );
}
