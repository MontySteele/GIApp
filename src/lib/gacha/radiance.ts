import type { GachaRules } from '@/types';

/**
 * Capturing Radiance (Version 5.0+), modelled as the community-derived state machine
 * keyed on consecutive 50/50 losses (a guaranteed pull neither wins nor loses a 50/50,
 * so it does not change the streak):
 *
 *   consecutive losses 0 → 50%   featured
 *   consecutive losses 1 → 50%
 *   consecutive losses 2 → 75%
 *   consecutive losses 3 → 100%  (radiance guaranteed)
 *
 * The stationary featured rate of this chain is 55.2%, which is the figure usually
 * quoted as "the 50/50 is really 55/45". Using a flat 55% AND a hard guarantee at
 * three losses double-counts the effect.
 */
export function getRadianceFeaturedRate(radiantStreak: number, rules: GachaRules): number {
  if (!rules.hasCapturingRadiance) {
    return rules.featuredRate ?? 0.5;
  }
  const threshold = rules.radianceThreshold ?? 3;
  if (radiantStreak >= threshold) return 1.0;
  if (radiantStreak === threshold - 1) return 0.75;
  return rules.featuredRate ?? 0.5;
}

/** True when the next non-guaranteed 5★ is forced featured by Capturing Radiance. */
export function isRadianceGuaranteed(radiantStreak: number, rules: GachaRules): boolean {
  if (!rules.hasCapturingRadiance) return false;
  return radiantStreak >= (rules.radianceThreshold ?? 3);
}
