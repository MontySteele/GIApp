import { describe, it, beforeEach, expect } from 'vitest';
import { db } from '@/db/schema';
import { primogemEntryRepo } from './primogemEntryRepo';
import { fateEntryRepo } from './fateEntryRepo';
import { resourceSnapshotRepo } from './resourceSnapshotRepo';
import type { PrimogemSource, FateSource } from '@/types';

describe('Ledger repositories', () => {
  beforeEach(async () => {
    await db.primogemEntries.clear();
    await db.fateEntries.clear();
    await db.resourceSnapshots.clear();
  });

  describe('primogemEntryRepo', () => {
    const baseSource: PrimogemSource = 'event';

    it('creates entries with default timestamps and metadata', async () => {
      const id = await primogemEntryRepo.create({
        amount: 60,
        source: baseSource,
        notes: 'Daily',
      });

      const stored = await primogemEntryRepo.getById(id);
      expect(stored?.id).toBe(id);
      expect(stored?.timestamp).toMatch(/^\\d{4}-\\d{2}-\\d{2}T/);
      expect(stored?.createdAt).toBe(stored?.updatedAt);
    });

    it('updates entries and refreshes updatedAt', async () => {
      const id = await primogemEntryRepo.create({
        amount: 100,
        source: baseSource,
        notes: '',
        timestamp: '2024-01-01T00:00:00.000Z',
      });
      const original = await primogemEntryRepo.getById(id);
      await primogemEntryRepo.update(id, { amount: 200 });
      const updated = await primogemEntryRepo.getById(id);

      expect(updated?.amount).toBe(200);
      expect(updated?.updatedAt).not.toBe(original?.updatedAt);
      expect(updated?.timestamp).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('fateEntryRepo', () => {
    const baseSource: FateSource = 'event';

    it('creates entries with default timestamps and metadata', async () => {
      const id = await fateEntryRepo.create({
        amount: 5,
        fateType: 'intertwined',
        source: baseSource,
      });

      const stored = await fateEntryRepo.getById(id);
      expect(stored?.timestamp).toMatch(/^\\d{4}-\\d{2}-\\d{2}T/);
      expect(stored?.createdAt).toBe(stored?.updatedAt);
    });

    it('updates entries and preserves timestamp unless provided', async () => {
      const id = await fateEntryRepo.create({
        amount: 2,
        fateType: 'acquaint',
        source: baseSource,
      });

      const original = await fateEntryRepo.getById(id);
      await fateEntryRepo.update(id, { amount: 3, timestamp: '2024-02-02T00:00:00.000Z' });
      const updated = await fateEntryRepo.getById(id);

      expect(updated?.amount).toBe(3);
      expect(updated?.timestamp).toBe('2024-02-02T00:00:00.000Z');
      expect(updated?.updatedAt).not.toBe(original?.updatedAt);
    });
  });

  describe('resourceSnapshotRepo', () => {
    it('stores snapshots with default timestamps and createdAt', async () => {
      const id = await resourceSnapshotRepo.create({
        primogems: 1600,
        intertwined: 5,
        acquaint: 3,
        starglitter: 20,
        stardust: 400,
      });

      const snapshot = await resourceSnapshotRepo.getLatest();
      expect(snapshot?.id).toBe(id);
      expect(snapshot?.timestamp).toMatch(/^\\d{4}-\\d{2}-\\d{2}T/);
      expect(snapshot?.createdAt).toBeDefined();
    });
  });
});
