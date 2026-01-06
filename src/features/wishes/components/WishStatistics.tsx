import type { BannerType } from '@/types';
import type { BannerStats } from '../domain/wishAnalyzer';

interface WishStatisticsProps {
  stats: BannerStats;
  bannerType: BannerType;
}

const formatPercent = (value: number, decimals = 1) => {
  const roundedValue = Number(value.toFixed(decimals));
  return `${roundedValue}%`;
};

export function WishStatistics({ stats, bannerType }: WishStatisticsProps) {
  // Expected rates for comparison
  const expectedFiveStarRate = 1.6;
  const expectedFourStarRate = 13;

  // Banner display name
  const getBannerName = () => {
    switch (bannerType) {
      case 'character':
        return 'Character Event';
      case 'weapon':
        return 'Weapon Event';
      case 'standard':
        return 'Standard';
      case 'chronicled':
        return 'Chronicled Wish';
    }
  };

  // Get color class for rate comparison
  const getRateColor = (actualRate: number, expectedRate: number) => {
    if (actualRate > expectedRate) return 'text-green-400';
    if (actualRate < expectedRate) return 'text-red-400';
    return 'text-slate-100';
  };

  // Empty state
  if (stats.totalPulls === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        No wish data available for this banner yet.
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Wish Statistics"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {/* Total Pulls */}
      <article className="p-4 border rounded-lg bg-slate-800 border-slate-700">
        <h3 className="text-sm font-medium text-slate-400">
          Total Pulls
        </h3>
        <p className="text-3xl font-bold mt-2 text-slate-100">{stats.totalPulls}</p>
        <p className="text-xs text-slate-400 mt-1">
          {getBannerName()}
        </p>
      </article>

      {/* 5-Star Count */}
      <article className="p-4 border rounded-lg bg-slate-800 border-slate-700">
        <h3 className="text-sm font-medium text-slate-400">
          5-Star Pulls
        </h3>
        <p className="text-3xl font-bold mt-2 text-slate-100">{stats.fiveStars}</p>
        <p className="text-xs text-slate-400 mt-1">
          {stats.fiveStars} / {stats.totalPulls}
        </p>
      </article>

      {/* 4-Star Count */}
      <article className="p-4 border rounded-lg bg-slate-800 border-slate-700">
        <h3 className="text-sm font-medium text-slate-400">
          4-Star Pulls
        </h3>
        <p className="text-3xl font-bold mt-2 text-slate-100">{stats.fourStars}</p>
        <p className="text-xs text-slate-400 mt-1">
          {stats.fourStars} / {stats.totalPulls}
        </p>
      </article>

      {/* 3-Star Count */}
      <article className="p-4 border rounded-lg bg-slate-800 border-slate-700">
        <h3 className="text-sm font-medium text-slate-400">
          3-Star Pulls
        </h3>
        <p className="text-3xl font-bold mt-2 text-slate-100">{stats.threeStars}</p>
        <p className="text-xs text-slate-400 mt-1">
          {stats.threeStars} / {stats.totalPulls}
        </p>
      </article>

      {/* 5-Star Rate */}
      <article className="p-4 border rounded-lg bg-slate-800 border-slate-700">
        <h3 className="text-sm font-medium text-slate-400">
          5-Star Rate
        </h3>
        <p className={`text-3xl font-bold mt-2 ${getRateColor(stats.fiveStarRate, expectedFiveStarRate)}`}>
          {formatPercent(stats.fiveStarRate)}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Expected: {formatPercent(expectedFiveStarRate)}
        </p>
      </article>

      {/* 4-Star Rate */}
      <article className="p-4 border rounded-lg bg-slate-800 border-slate-700">
        <h3 className="text-sm font-medium text-slate-400">
          4-Star Rate
        </h3>
        <p className={`text-3xl font-bold mt-2 ${getRateColor(stats.fourStarRate, expectedFourStarRate)}`}>
          {formatPercent(stats.fourStarRate)}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Expected: {formatPercent(expectedFourStarRate)}
        </p>
      </article>

      {/* Average 5-Star Pity */}
      <article className="p-4 border rounded-lg bg-slate-800 border-slate-700">
        <h3 className="text-sm font-medium text-slate-400">
          Average 5-Star Pity
        </h3>
        <p className="text-3xl font-bold mt-2 text-slate-100">
          {stats.fiveStars > 0 ? stats.averageFiveStarPity : 'N/A'}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {stats.fiveStars > 0 ? `Based on ${stats.fiveStars} pulls` : 'No 5-stars yet'}
        </p>
      </article>

      {/* Average 4-Star Pity */}
      <article className="p-4 border rounded-lg bg-slate-800 border-slate-700">
        <h3 className="text-sm font-medium text-slate-400">
          Average 4-Star Pity
        </h3>
        <p className="text-3xl font-bold mt-2 text-slate-100">
          {stats.fourStars > 0 ? stats.averageFourStarPity : 'N/A'}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {stats.fourStars > 0 ? `Based on ${stats.fourStars} pulls` : 'No 4-stars yet'}
        </p>
      </article>

      {/* 50/50 Win Rate (only for character and chronicled banners) */}
      {(bannerType === 'character' || bannerType === 'chronicled') && (
        <article className="p-4 border rounded-lg bg-slate-800 border-slate-700">
          <h3 className="text-sm font-medium text-slate-400">
            50/50 Win Rate
          </h3>
          <p className="text-3xl font-bold mt-2 text-slate-100">
            {formatPercent(stats.fiftyFiftyWinRate)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Won: {stats.fiftyFiftyWon} | Lost: {stats.fiftyFiftyLost}
          </p>
        </article>
      )}
    </div>
  );
}
