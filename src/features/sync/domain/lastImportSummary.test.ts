import { describe, expect, it } from 'vitest';
import {
  clearLastImportSummary,
  readLastImportSummary,
  writeLastImportSummary,
  type LastImportSummary,
} from './lastImportSummary';

function createStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

const summary: LastImportSummary = {
  source: 'Backup',
  importedAt: '2026-05-11T00:00:00.000Z',
  totals: {
    created: 2,
    updated: 1,
    skipped: 0,
  },
  rows: [
    {
      id: 'roster',
      title: 'Roster refreshed',
      detail: '2 characters available for target and team planning.',
      href: '/roster',
    },
  ],
};

describe('last import summary storage', () => {
  it('writes, reads, and clears the last import summary', () => {
    const storage = createStorage();

    writeLastImportSummary(summary, storage);
    expect(readLastImportSummary(storage)).toEqual(summary);

    clearLastImportSummary(storage);
    expect(readLastImportSummary(storage)).toBeNull();
  });

  it('ignores malformed stored summaries', () => {
    const storage = createStorage();
    storage.setItem('giapp:last-import-summary', '{"rows":{}}');

    expect(readLastImportSummary(storage)).toBeNull();
  });
});
