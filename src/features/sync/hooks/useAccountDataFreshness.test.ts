import { describe, expect, it } from 'vitest';
import type { ImportRecord } from '@/types';
import { getAccountDataFreshness } from './useAccountDataFreshness';

function makeImport(importedAt: string): ImportRecord {
  return {
    id: 'import-1',
    source: 'Irminsul',
    importedAt,
    characterCount: 10,
    artifactCount: 120,
    weaponCount: 30,
    materialCount: 80,
  };
}

describe('getAccountDataFreshness', () => {
  const now = new Date('2026-05-06T12:00:00.000Z');

  it('marks account data missing when there is no import record', () => {
    const freshness = getAccountDataFreshness(null, now);

    expect(freshness.status).toBe('missing');
    expect(freshness.label).toBe('Import account data');
  });

  it('marks recent imports fresh', () => {
    const freshness = getAccountDataFreshness(
      makeImport('2026-05-04T12:00:00.000Z'),
      now
    );

    expect(freshness.status).toBe('fresh');
    expect(freshness.daysSinceImport).toBe(2);
    expect(freshness.detail).toContain('2 days ago');
  });

  it('marks old imports stale', () => {
    const freshness = getAccountDataFreshness(
      makeImport('2026-04-20T12:00:00.000Z'),
      now
    );

    expect(freshness.status).toBe('stale');
    expect(freshness.daysSinceImport).toBe(16);
    expect(freshness.label).toBe('Refresh account data');
  });
});
