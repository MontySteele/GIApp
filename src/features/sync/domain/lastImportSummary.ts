import type { ImportValueRow } from './importValueSummary';
import { STORAGE_KEYS } from '@/lib/constants/storageKeys';

export interface LastImportSummary {
  source: string;
  importedAt: string;
  totals: {
    created: number;
    updated: number;
    skipped: number;
  };
  rows: ImportValueRow[];
}

const STORAGE_KEY = STORAGE_KEYS.LAST_IMPORT_SUMMARY;

export function readLastImportSummary(storage: Storage = localStorage): LastImportSummary | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastImportSummary;
    if (!parsed || typeof parsed.importedAt !== 'string' || !Array.isArray(parsed.rows)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeLastImportSummary(
  summary: LastImportSummary,
  storage: Storage = localStorage
): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(summary));
}

export function clearLastImportSummary(storage: Storage = localStorage): void {
  storage.removeItem(STORAGE_KEY);
}
