import { db } from '@/db/schema';
import type { ResourceSnapshot } from '@/types';

type ResourceSnapshotInput = Omit<ResourceSnapshot, 'id' | 'createdAt'> & {
  timestamp?: string;
};

export const resourceSnapshotRepo = {
  async getLatest(): Promise<ResourceSnapshot | undefined> {
    return db.resourceSnapshots.orderBy('timestamp').reverse().first();
  },

  async getAll(): Promise<ResourceSnapshot[]> {
    return db.resourceSnapshots.orderBy('timestamp').reverse().toArray();
  },

  async create(snapshot: ResourceSnapshotInput): Promise<string> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db.resourceSnapshots.add({
      ...snapshot,
      timestamp: snapshot.timestamp ?? now,
      id,
      createdAt: now,
    });

    return id;
  },
};
