import type { Collection } from 'dexie';
import { db } from '@/db/schema';
import type { ChecklistItem, Goal, GoalCategory, GoalStatus } from '@/types';

export interface GoalQuery {
  status?: GoalStatus | GoalStatus[];
  category?: GoalCategory | GoalCategory[];
  linkedCharacterKey?: string;
  linkedTeamId?: string;
  search?: string;
}

function normalizeArray<T>(value?: T | T[]): T[] | undefined {
  if (value === undefined) return undefined;

  return Array.isArray(value) ? value : [value];
}

function buildQueryCollection(filters: GoalQuery): Collection<Goal, string> {
  const statuses = normalizeArray(filters.status);
  const categories = normalizeArray(filters.category);

  if (statuses?.length) {
    return db.goals.where('status').anyOf(statuses);
  }

  if (categories?.length) {
    return db.goals.where('category').anyOf(categories);
  }

  return db.goals.orderBy('updatedAt').reverse();
}

export const goalRepo = {
  async getById(id: string): Promise<Goal | undefined> {
    return db.goals.get(id);
  },

  async query(filters: GoalQuery = {}): Promise<Goal[]> {
    const collection = buildQueryCollection(filters);
    const statuses = normalizeArray(filters.status);
    const categories = normalizeArray(filters.category);
    const searchTerm = filters.search?.toLowerCase();

    const results = await collection
      .filter((goal) => {
        if (statuses?.length && !statuses.includes(goal.status)) return false;
        if (categories?.length && !categories.includes(goal.category)) return false;
        if (filters.linkedCharacterKey && goal.linkedCharacterKey !== filters.linkedCharacterKey) return false;
        if (filters.linkedTeamId && goal.linkedTeamId !== filters.linkedTeamId) return false;
        if (searchTerm) {
          const combined = `${goal.title} ${goal.description}`.toLowerCase();
          return combined.includes(searchTerm);
        }

        return true;
      })
      .toArray();

    return results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async create(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>): Promise<string> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const completedAt = goal.status === 'completed' ? now : undefined;

    await db.goals.add({
      ...goal,
      id,
      createdAt: now,
      updatedAt: now,
      completedAt,
    });

    return id;
  },

  async update(
    id: string,
    updates: Partial<Omit<Goal, 'id' | 'createdAt' | 'completedAt'>> & { status?: GoalStatus }
  ): Promise<void> {
    const existing = await db.goals.get(id);
    if (!existing) return;

    const now = new Date().toISOString();
    let completedAt = existing.completedAt;

    if (updates.status && updates.status !== existing.status) {
      completedAt = updates.status === 'completed' ? now : undefined;
    }

    await db.goals.update(id, {
      ...updates,
      completedAt,
      updatedAt: now,
    });
  },

  async delete(id: string): Promise<void> {
    await db.goals.delete(id);
  },

  async addChecklistItem(goalId: string, text: string): Promise<void> {
    const goal = await db.goals.get(goalId);
    if (!goal) return;

    const now = new Date().toISOString();
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text,
      completed: false,
    };

    await db.goals.update(goalId, {
      checklist: [...goal.checklist, newItem],
      updatedAt: now,
    });
  },

  async toggleChecklistItem(goalId: string, itemId: string): Promise<void> {
    const goal = await db.goals.get(goalId);
    if (!goal) return;

    const now = new Date().toISOString();
    const checklist = goal.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    await db.goals.update(goalId, {
      checklist,
      updatedAt: now,
    });
  },

  async removeChecklistItem(goalId: string, itemId: string): Promise<void> {
    const goal = await db.goals.get(goalId);
    if (!goal) return;

    const now = new Date().toISOString();
    const checklist = goal.checklist.filter((item) => item.id !== itemId);

    await db.goals.update(goalId, {
      checklist,
      updatedAt: now,
    });
  },
};
