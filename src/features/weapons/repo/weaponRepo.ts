import { db } from '@/db/schema';
import type { InventoryWeapon } from '@/types';

/**
 * Weapon Repository
 *
 * Manages standalone weapon inventory (can be equipped or unequipped)
 * Supports full Irminsul/GOOD format imports
 */

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
