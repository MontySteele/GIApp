import { db } from '@/db/schema';
import type { InventoryArtifact, SlotKey } from '@/types';

/**
 * Artifact Repository
 *
 * Manages standalone artifact inventory (can be equipped or unequipped)
 * Supports full Irminsul/GOOD format imports
 */

export const artifactRepo = {
  async getAll(): Promise<InventoryArtifact[]> {
    return db.inventoryArtifacts.toArray();
  },

  async getByLocation(characterKey: string): Promise<InventoryArtifact[]> {
    return db.inventoryArtifacts.where('location').equals(characterKey).toArray();
  },

  async getUnequipped(): Promise<InventoryArtifact[]> {
    return db.inventoryArtifacts.where('location').equals('').toArray();
  },

  async getBySetKey(setKey: string): Promise<InventoryArtifact[]> {
    return db.inventoryArtifacts.where('setKey').equals(setKey).toArray();
  },

  async getBySlot(slotKey: SlotKey): Promise<InventoryArtifact[]> {
    return db.inventoryArtifacts.where('slotKey').equals(slotKey).toArray();
  },

  async get(id: string): Promise<InventoryArtifact | undefined> {
    return db.inventoryArtifacts.get(id);
  },

  async create(artifact: Omit<InventoryArtifact, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    await db.inventoryArtifacts.add({
      ...artifact,
      id,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },

  async update(id: string, updates: Partial<Omit<InventoryArtifact, 'id' | 'createdAt'>>): Promise<void> {
    await db.inventoryArtifacts.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<void> {
    await db.inventoryArtifacts.delete(id);
  },

  async bulkUpsert(artifacts: Omit<InventoryArtifact, 'createdAt' | 'updatedAt'>[]): Promise<void> {
    const now = new Date().toISOString();
    const itemsWithTimestamps = artifacts.map((artifact) => ({
      ...artifact,
      createdAt: now,
      updatedAt: now,
    }));
    await db.inventoryArtifacts.bulkPut(itemsWithTimestamps);
  },

  async clear(): Promise<void> {
    await db.inventoryArtifacts.clear();
  },

  async count(): Promise<number> {
    return db.inventoryArtifacts.count();
  },
};
