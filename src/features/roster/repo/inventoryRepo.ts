import { db } from '@/db/schema';
import type {
  InventoryArtifact,
  InventoryWeapon,
  MaterialInventory,
  ImportRecord,
  SlotKey,
} from '@/types';

// ============================================
// Artifact Repository
// ============================================

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

// ============================================
// Weapon Repository
// ============================================

export const weaponRepo = {
  async getAll(): Promise<InventoryWeapon[]> {
    return db.inventoryWeapons.toArray();
  },

  async getByLocation(characterKey: string): Promise<InventoryWeapon[]> {
    return db.inventoryWeapons.where('location').equals(characterKey).toArray();
  },

  async getUnequipped(): Promise<InventoryWeapon[]> {
    return db.inventoryWeapons.where('location').equals('').toArray();
  },

  async getByKey(weaponKey: string): Promise<InventoryWeapon[]> {
    return db.inventoryWeapons.where('key').equals(weaponKey).toArray();
  },

  async get(id: string): Promise<InventoryWeapon | undefined> {
    return db.inventoryWeapons.get(id);
  },

  async create(weapon: Omit<InventoryWeapon, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    await db.inventoryWeapons.add({
      ...weapon,
      id,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },

  async update(id: string, updates: Partial<Omit<InventoryWeapon, 'id' | 'createdAt'>>): Promise<void> {
    await db.inventoryWeapons.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<void> {
    await db.inventoryWeapons.delete(id);
  },

  async bulkUpsert(weapons: Omit<InventoryWeapon, 'createdAt' | 'updatedAt'>[]): Promise<void> {
    const now = new Date().toISOString();
    const itemsWithTimestamps = weapons.map((weapon) => ({
      ...weapon,
      createdAt: now,
      updatedAt: now,
    }));
    await db.inventoryWeapons.bulkPut(itemsWithTimestamps);
  },

  async clear(): Promise<void> {
    await db.inventoryWeapons.clear();
  },

  async count(): Promise<number> {
    return db.inventoryWeapons.count();
  },
};

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
