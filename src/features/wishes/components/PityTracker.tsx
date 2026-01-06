import type { BannerType } from '@/types';
import type { PityState } from '../domain/wishAnalyzer';
import { GACHA_RULES } from '@/lib/constants';

interface PityTrackerProps {
  pityState: PityState;
  bannerType: BannerType;
}

export function PityTracker({ pityState, bannerType }: PityTrackerProps) {
  const rules = GACHA_RULES[bannerType];
  const { fiveStarPity, fourStarPity, guaranteed } = pityState;

  // Calculate progress percentages
  const fiveStarProgress = (fiveStarPity / rules.hardPity) * 100;
  const fourStarProgress = (fourStarPity / 10) * 100; // 4-star hard pity is always 10

  // Determine 5-star pity color
  const getFiveStarColor = () => {
    if (fiveStarPity >= rules.hardPity - 2) return 'bg-red-500'; // Near hard pity
    if (fiveStarPity >= rules.softPityStart) return 'bg-yellow-500'; // Soft pity range
    return 'bg-green-500'; // Safe range
  };

  // Determine 4-star pity color
  const getFourStarColor = () => {
    if (fourStarPity >= 9) return 'bg-red-500'; // Near hard pity
    if (fourStarPity >= 7) return 'bg-yellow-500'; // Getting close
    return 'bg-green-500'; // Safe range
  };

  // Calculate pulls until milestones
  const pullsUntilSoftPity = Math.max(0, rules.softPityStart + 1 - fiveStarPity);
  const pullsUntilHardPity = Math.max(0, rules.hardPity - fiveStarPity);

  return (
    <div className="space-y-6">
      {/* 5-Star Pity */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">5-Star Pity</h3>
          <span className="text-2xl font-bold">{fiveStarPity}</span>
        </div>

        {/* Progress bar */}
        <div className="relative h-8 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${getFiveStarColor()}`}
            style={{ width: `${fiveStarProgress}%` }}
            role="progressbar"
            aria-label="5-star pity progress"
            aria-valuenow={fiveStarPity}
            aria-valuemax={rules.hardPity}
          />
          <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-slate-100">
            {fiveStarPity} / {rules.hardPity}
          </div>
        </div>

        {/* Status indicators */}
        <div className="space-y-1 text-sm">
          {/* Guaranteed/50-50 status (only for character/chronicled) */}
          {(bannerType === 'character' || bannerType === 'chronicled') && (
            <div>
              {guaranteed ? (
                <span className="text-green-400 font-semibold">
                  ✓ Guaranteed Featured
                </span>
              ) : (
                <span className="text-yellow-400">
                  50/50
                </span>
              )}
            </div>
          )}

          {/* Soft pity warning */}
          {fiveStarPity >= rules.softPityStart + 1 && fiveStarPity < rules.hardPity && (
            <div className="text-yellow-400">
              ⚠ Soft pity active (increased rates)
            </div>
          )}

          {/* Hard pity warning */}
          {fiveStarPity >= rules.hardPity - 1 && (
            <div className="text-red-400 font-semibold">
              ⚠ Guaranteed next pull!
            </div>
          )}

          {/* Pulls until milestones */}
          {fiveStarPity < 60 && fiveStarPity < rules.hardPity - 1 && (
            <div className="text-slate-400">
              {pullsUntilSoftPity} pulls until soft pity
            </div>
          )}
          {fiveStarPity >= 60 && fiveStarPity < rules.hardPity - 1 && (
            <div className="text-slate-400">
              {pullsUntilHardPity} pulls until hard pity
            </div>
          )}
        </div>
      </div>

      {/* 4-Star Pity */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">4-Star Pity</h3>
          <span className="text-xl font-bold">{fourStarPity}</span>
        </div>

        {/* Progress bar */}
        <div className="relative h-6 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${getFourStarColor()}`}
            style={{ width: `${fourStarProgress}%` }}
            role="progressbar"
            aria-label="4-star pity progress"
            aria-valuenow={fourStarPity}
            aria-valuemax={10}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-100">
            {fourStarPity} / 10
          </div>
        </div>

        {/* 4-star hard pity warning */}
        {fourStarPity >= 9 && (
          <div className="text-sm text-red-400">
            4-star guaranteed next pull!
          </div>
        )}
      </div>
    </div>
  );
}
