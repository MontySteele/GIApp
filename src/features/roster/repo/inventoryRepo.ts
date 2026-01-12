/**
 * Roster Inventory Repositories
 *
 * Manages materials and import tracking.
 * Artifact and weapon repos have been moved to their respective feature folders.
 */

import { db } from '@/db/schema';
import type { MaterialInventory, ImportRecord } from '@/types';

// ============================================
// Material Repository
// ============================================

const MATERIALS_ID = 'materials';

export const materialRepo = {
  async get(): Promise<MaterialInventory | undefined> {
    return db.materialInventory.get(MATERIALS_ID);
  },

  async set(materials: Record<string, number>): Promise<void> {
    await db.materialInventory.put({
      id: MATERIALS_ID,
      materials,
      updatedAt: new Date().toISOString(),
    });
  },

  async getMaterial(key: string): Promise<number> {
    const inventory = await db.materialInventory.get(MATERIALS_ID);
    return inventory?.materials[key] ?? 0;
  },

  async setMaterial(key: string, count: number): Promise<void> {
    const inventory = await db.materialInventory.get(MATERIALS_ID);
    const materials = inventory?.materials ?? {};
    materials[key] = count;
    await db.materialInventory.put({
      id: MATERIALS_ID,
      materials,
      updatedAt: new Date().toISOString(),
    });
  },

  async clear(): Promise<void> {
    await db.materialInventory.delete(MATERIALS_ID);
  },
};

// ============================================
// Import Record Repository
// ============================================

export const importRecordRepo = {
  async getAll(): Promise<ImportRecord[]> {
    return db.importRecords.orderBy('importedAt').reverse().toArray();
  },

  async getLatest(): Promise<ImportRecord | undefined> {
    return db.importRecords.orderBy('importedAt').reverse().first();
  },

  async create(record: Omit<ImportRecord, 'id'>): Promise<string> {
    const id = crypto.randomUUID();
    await db.importRecords.add({ ...record, id });
    return id;
  },

  async delete(id: string): Promise<void> {
    await db.importRecords.delete(id);
  },

  async clear(): Promise<void> {
    await db.importRecords.clear();
  },
};

// Note: artifactRepo moved to @/features/artifacts/repo/artifactRepo
// Note: weaponRepo moved to @/features/weapons/repo/weaponRepo
