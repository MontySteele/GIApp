import { getDisplayName } from '@/lib/gameData';
import type { PlannedBanner } from '@/types';

export function buildBannerCalculatorUrl(banner: PlannedBanner): string {
  const params = new URLSearchParams({
    mode: 'multi',
    name: `${getDisplayName(banner.characterKey)} banner`,
  });

  if (banner.maxPullBudget) {
    params.set('pulls', String(banner.maxPullBudget));
  }

  params.append(
    'target',
    JSON.stringify({
      name: banner.characterKey,
      banner: 'character',
      copies: 1,
    })
  );

  return `/pulls/calculator?${params.toString()}`;
}
