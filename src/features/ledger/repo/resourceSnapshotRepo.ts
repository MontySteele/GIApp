import { db } from '@/db/schema';
import type { ResourceSnapshot } from '@/types';

type ResourceSnapshotInput = Omit<ResourceSnapshot, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> & {
  timestamp?: string;
};

export const resourceSnapshotRepo = {
  async getLatest(): Promise<ResourceSnapshot | undefined> {
    return db.resourceSnapshots
      .orderBy('timestamp')
      .filter((snapshot) => !snapshot.deletedAt)
      .reverse()
      .first();
  },

  async getAll(): Promise<ResourceSnapshot[]> {
    return db.resourceSnapshots
      .orderBy('timestamp')
      .filter((snapshot) => !snapshot.deletedAt)
      .reverse()
      .toArray();
  },

  async create(snapshot: ResourceSnapshotInput): Promise<string> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db.resourceSnapshots.add({
      ...snapshot,
      genesisCrystals: snapshot.genesisCrystals ?? 0,
      timestamp: snapshot.timestamp ?? now,
      id,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    return id;
  },
};
