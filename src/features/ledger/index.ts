/**
 * Ledger Feature
 *
 * Public API for primogem and resource tracking
 */

// Pages
export { default as LedgerPage } from './pages/LedgerPage';

// Hooks
export { useResources } from './hooks/useResources';

// Repositories
export { ledgerRepo } from './repo/ledgerRepo';
export { primogemEntryRepo } from './repo/primogemEntryRepo';
export { fateEntryRepo } from './repo/fateEntryRepo';
export { resourceSnapshotRepo } from './repo/resourceSnapshotRepo';

// Domain - Resource Calculations
export {
  PRIMOGEM_SOURCES,
  bannerToFateType,
  calculateWishSpending,
  calculateAvailablePulls,
  splitPrimogemIncome,
  bucketPrimogemEntries,
  type WishSpendingTotals,
  type LedgerResourceSnapshot,
  type IncomeInterval,
  type IncomeBucketFilters,
  type IncomeBucket,
} from './domain/resourceCalculations';

// Domain - Historical Reconstruction
export {
  filterToIntertwinedWishes,
  buildHistoricalData,
  buildProjectionData,
  buildUnifiedChartData,
  buildTransactionLog,
  calculateDailyRateFromWishes,
  type HistoricalDataPoint,
  type ProjectionDataPoint,
  type ChartDataPoint,
  type TransactionLogEntry,
} from './domain/historicalReconstruction';

// Components
export { default as IncomeTimeline } from './components/IncomeTimeline';
export { default as ProjectionChart } from './components/ProjectionChart';
export { default as PurchaseLedger } from './components/PurchaseLedger';
export { default as TransactionLog } from './components/TransactionLog';
export { default as UnifiedChart } from './components/UnifiedChart';
