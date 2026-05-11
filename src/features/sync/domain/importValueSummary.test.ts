import { describe, expect, it } from 'vitest';
import { buildImportValueRows } from './importValueSummary';
import type { ImportResult } from '../services/importService';

function emptyResult(): ImportResult {
  const stats = {
    characters: { created: 0, updated: 0, skipped: 0 },
    teams: { created: 0, updated: 0, skipped: 0 },
    wishRecords: { created: 0, skipped: 0 },
    primogemEntries: { created: 0, updated: 0, skipped: 0 },
    fateEntries: { created: 0, updated: 0, skipped: 0 },
    resourceSnapshots: { created: 0, updated: 0, skipped: 0 },
    goals: { created: 0, updated: 0, skipped: 0 },
    notes: { created: 0, updated: 0, skipped: 0 },
    plannedBanners: { created: 0, updated: 0, skipped: 0 },
    calculatorScenarios: { created: 0, updated: 0, skipped: 0 },
    inventoryArtifacts: { created: 0, updated: 0, skipped: 0 },
    inventoryWeapons: { created: 0, updated: 0, skipped: 0 },
    materialInventory: { created: 0, updated: 0, skipped: 0 },
    campaigns: { created: 0, updated: 0, skipped: 0 },
  };

  return {
    success: true,
    stats,
    warnings: [],
    errors: [],
  };
}

describe('buildImportValueRows', () => {
  it('summarizes user-facing changes after import', () => {
    const result = emptyResult();
    result.stats.characters.created = 3;
    result.stats.inventoryArtifacts.updated = 12;
    result.stats.wishRecords.created = 20;
    result.stats.resourceSnapshots.created = 1;
    result.stats.campaigns.created = 2;

    expect(buildImportValueRows(result)).toEqual([
      expect.objectContaining({ id: 'roster', href: '/roster' }),
      expect.objectContaining({ id: 'build-data', href: '/planner' }),
      expect.objectContaining({ id: 'wishes', href: '/pulls/history' }),
      expect.objectContaining({ id: 'budget', href: '/pulls' }),
      expect.objectContaining({ id: 'targets', href: '/campaigns' }),
    ]);
  });

  it('returns no rows when nothing changed', () => {
    expect(buildImportValueRows(emptyResult())).toEqual([]);
  });
});
