/**
 * Wishes Feature
 *
 * Public API for wish history and pity tracking
 */

// Pages
export { default as WishesPage } from './pages/WishesPage';
export { WishHistoryPage } from './pages/WishHistoryPage';

// Hooks
export { useCurrentPity, useAllCurrentPity } from './hooks/useCurrentPity';

// Repositories
export { wishRepo, type NewWishRecord } from './repo/wishRepo';
export { upcomingWishRepo } from './repo/upcomingWishRepo';

// Domain - Wish Analyzer
export {
  calculatePityState,
  calculateStatistics,
  findFiveStarPulls,
  findFourStarPulls,
  analyzeWishHistory,
  type WishHistoryItem,
  type PityState,
  type BannerStats,
  type FiveStarPull,
  type WishAnalysis,
} from './domain/wishAnalyzer';

// Domain - Wish Replay
export {
  replayWishHistory,
  type WishReplayResult,
} from './domain/wishReplay';

// Selectors
export {
  getPityByBanner,
  getPityForBanner,
  type BannerPitySnapshot,
} from './selectors/pitySelectors';

// Mappers
export { mapHistoryToWishRecords } from './mappers/wishHistoryMapper';

// Data
export {
  isStandardCharacter,
  isStandardWeapon,
  resolveIsFeatured,
} from './data/standardPool';

// Lib
export { toWishRecord, toWishHistoryItem } from './lib/wishNormalization';
export {
  loadWishSession,
  saveWishSession,
  clearWishSession,
  isWishSessionExpired,
  getWishSessionExpiry,
  WISH_AUTH_SESSION_KEY,
  type WishAuthSession,
} from './lib/wishSession';

// Utils
export {
  wishHistoryItemToRecord,
  wishRecordToHistoryItem,
  summarizeWishRecords,
  loadWishHistoryFromRepo,
} from './utils/wishHistory';

// Components
export { PityTracker } from './components/PityTracker';
export { default as PullHistoryChart } from './components/PullHistoryChart';
export { WishHistoryList } from './components/WishHistoryList';
export { WishImport, GACHA_TYPE_MAP } from './components/WishImport';
export { WishManualEntry } from './components/WishManualEntry';
export { WishStatistics } from './components/WishStatistics';
export { default as PityHeader } from './components/PityHeader';
