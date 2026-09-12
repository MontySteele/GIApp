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

    // Narrow with one indexed string filter first, then apply the rest in
    // memory. `isOfficial` is a boolean and IndexedDB cannot index booleans,
    // so it is never used as the indexed filter.
    if (filters.characterKey) {
      collection = db.buildTemplates.where('characterKey').equals(filters.characterKey);
    } else if (filters.role) {
      collection = db.buildTemplates.where('role').equals(filters.role);
    } else if (filters.difficulty) {
      collection = db.buildTemplates.where('difficulty').equals(filters.difficulty);
    } else if (filters.budget) {
      collection = db.buildTemplates.where('budget').equals(filters.budget);
    }

    let results = await collection.toArray();

    if (filters.role) {
      results = results.filter((t) => t.role === filters.role);
    }
    if (filters.difficulty) {
      results = results.filter((t) => t.difficulty === filters.difficulty);
    }
    if (filters.budget) {
      results = results.filter((t) => t.budget === filters.budget);
    }
    if (filters.isOfficial !== undefined) {
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
   * Get all official (community-verified) builds.
   * Filtered in memory: IndexedDB does not index boolean values, so the
   * `isOfficial` index can never match.
   */
  async getOfficialBuilds(): Promise<BuildTemplate[]> {
    return db.buildTemplates.filter((t) => t.isOfficial === true).toArray();
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
