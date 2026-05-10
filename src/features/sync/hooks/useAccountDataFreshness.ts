import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { importRecordRepo } from '@/features/roster/repo/inventoryRepo';
import type { ImportRecord } from '@/types';

export type AccountDataFreshnessStatus = 'fresh' | 'stale' | 'missing';

export interface AccountDataFreshness {
  status: AccountDataFreshnessStatus;
  isLoading?: boolean;
  latestImport: ImportRecord | null;
  daysSinceImport: number | null;
  label: string;
  detail: string;
}

const DEFAULT_STALE_AFTER_DAYS = 7;

function daysBetween(start: Date, end: Date): number {
  const msDiff = end.getTime() - start.getTime();
  if (!Number.isFinite(msDiff)) return 0;
  return Math.max(0, Math.floor(msDiff / (1000 * 60 * 60 * 24)));
}

function formatImportAge(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export function getAccountDataFreshness(
  latestImport: ImportRecord | null | undefined,
  now: Date = new Date(),
  staleAfterDays = DEFAULT_STALE_AFTER_DAYS
): AccountDataFreshness {
  if (!latestImport) {
    return {
      status: 'missing',
      latestImport: null,
      daysSinceImport: null,
      label: 'Import account data',
      detail: 'Refresh from Irminsul/GOOD so campaigns can use current roster, weapons, artifacts, and materials.',
    };
  }

  const importedAt = new Date(latestImport.importedAt);
  if (Number.isNaN(importedAt.getTime())) {
    return {
      status: 'stale',
      latestImport,
      daysSinceImport: null,
      label: 'Refresh account data',
      detail: 'The latest import timestamp could not be read, so campaign readiness may be stale.',
    };
  }

  const daysSinceImport = daysBetween(importedAt, now);
  const ageLabel = formatImportAge(daysSinceImport);
  const source = latestImport.source || 'GOOD';

  if (daysSinceImport >= staleAfterDays) {
    return {
      status: 'stale',
      latestImport,
      daysSinceImport,
      label: 'Refresh account data',
      detail: `Last ${source} import was ${ageLabel}. Refresh before trusting campaign farming and build gaps.`,
    };
  }

  return {
    status: 'fresh',
    latestImport,
    daysSinceImport,
    label: 'Account data current',
    detail: `Last ${source} import was ${ageLabel}.`,
  };
}

export function useAccountDataFreshness(staleAfterDays = DEFAULT_STALE_AFTER_DAYS) {
  const latestImport = useLiveQuery(
    async () => (await importRecordRepo.getLatest()) ?? null,
    []
  );

  return useMemo(
    () => {
      if (latestImport === undefined) {
        return {
          status: 'fresh',
          isLoading: true,
          latestImport: null,
          daysSinceImport: null,
          label: 'Checking account data',
          detail: '',
        } satisfies AccountDataFreshness;
      }

      return getAccountDataFreshness(latestImport, new Date(), staleAfterDays);
    },
    [latestImport, staleAfterDays]
  );
}
