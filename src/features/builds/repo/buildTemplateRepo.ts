import { db } from '@/db/schema';
import type { BuildTemplate, CharacterRole, BuildDifficulty, BuildBudget } from '@/types';

export interface BuildTemplateFilters {
  characterKey?: string;
  role?: CharacterRole;
  difficulty?: BuildDifficulty;
  budget?: BuildBudget;
  isOfficial?: boolean;
  tags?: string[];
}

export const buildTemplateRepo = {
  async getAll(): Promise<BuildTemplate[]> {
    return db.buildTemplates.toArray();
  },

  async getById(id: string): Promise<BuildTemplate | undefined> {
    return db.buildTemplates.get(id);
  },

  async getByCharacter(characterKey: string): Promise<BuildTemplate[]> {
    return db.buildTemplates.where('characterKey').equals(characterKey).toArray();
  },

  async getFiltered(filters: BuildTemplateFilters): Promise<BuildTemplate[]> {
    let collection = db.buildTemplates.toCollection();

    // Apply indexed filters first for better performance
    if (filters.characterKey) {
      collection = db.buildTemplates.where('characterKey').equals(filters.characterKey);
    } else if (filters.role) {
      collection = db.buildTemplates.where('role').equals(filters.role);
    } else if (filters.difficulty) {
      collection = db.buildTemplates.where('difficulty').equals(filters.difficulty);
    } else if (filters.budget) {
      collection = db.buildTemplates.where('budget').equals(filters.budget);
    } else if (filters.isOfficial !== undefined) {
      collection = db.buildTemplates.where('isOfficial').equals(filters.isOfficial ? 1 : 0);
    }

    // Get results and filter in memory for remaining criteria
    let results = await collection.toArray();

    // Apply non-primary filters in memory
    if (filters.characterKey && filters.role) {
      results = results.filter((t) => t.role === filters.role);
    }
    if (filters.difficulty && filters.characterKey) {
      results = results.filter((t) => t.difficulty === filters.difficulty);
    }
    if (filters.budget && filters.characterKey) {
      results = results.filter((t) => t.budget === filters.budget);
    }
    if (filters.isOfficial !== undefined && filters.characterKey) {
      results = results.filter((t) => t.isOfficial === filters.isOfficial);
    }
    if (filters.tags && filters.tags.length > 0) {
      results = results.filter((t) =>
        filters.tags!.some((tag) => t.tags.includes(tag))
      );
    }

    return results;
  },

  async create(
    template: Omit<BuildTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db.buildTemplates.add({
      ...template,
      id,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },

  async update(
    id: string,
    updates: Partial<Omit<BuildTemplate, 'id' | 'createdAt'>>
  ): Promise<void> {
    await db.buildTemplates.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<void> {
    await db.buildTemplates.delete(id);
  },

  async deleteByCharacter(characterKey: string): Promise<number> {
    return db.buildTemplates.where('characterKey').equals(characterKey).delete();
  },

  async bulkCreate(
    templates: Omit<BuildTemplate, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<string[]> {
    const now = new Date().toISOString();
    const withMetadata = templates.map((template) => ({
      ...template,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }));

    await db.buildTemplates.bulkAdd(withMetadata);
    return withMetadata.map((t) => t.id);
  },

  /**
   * Get all official (community-verified) builds
   */
  async getOfficialBuilds(): Promise<BuildTemplate[]> {
    return db.buildTemplates.where('isOfficial').equals(1).toArray();
  },

  /**
   * Get builds by role (useful for finding all DPS builds, etc.)
   */
  async getByRole(role: CharacterRole): Promise<BuildTemplate[]> {
    return db.buildTemplates.where('role').equals(role).toArray();
  },

  /**
   * Get F2P-friendly builds
   */
  async getF2PBuilds(): Promise<BuildTemplate[]> {
    return db.buildTemplates.where('budget').anyOf(['f2p', '4-star']).toArray();
  },

  /**
   * Search templates by name or description
   */
  async search(query: string): Promise<BuildTemplate[]> {
    const lowerQuery = query.toLowerCase();
    return db.buildTemplates
      .filter(
        (t) =>
          t.name.toLowerCase().includes(lowerQuery) ||
          t.description.toLowerCase().includes(lowerQuery) ||
          t.characterKey.toLowerCase().includes(lowerQuery)
      )
      .toArray();
  },

  /**
   * Get count of templates per character
   */
  async getCountByCharacter(): Promise<Record<string, number>> {
    const templates = await db.buildTemplates.toArray();
    return templates.reduce((acc, t) => {
      acc[t.characterKey] = (acc[t.characterKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  },
};
