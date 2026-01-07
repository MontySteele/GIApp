import { db } from '@/db/schema';
import type { ChecklistItem, Goal } from '@/types';

const withUpdatedMetadata = <T extends Partial<Goal>>(updates: T, status?: Goal['status']) => {
  const now = new Date().toISOString();
  const nextStatus = status ?? updates.status;

  return {
    ...updates,
    updatedAt: now,
    ...(nextStatus
      ? {
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? updates.completedAt ?? now : undefined,
        }
      : {}),
  };
};

export const goalRepo = {
  async getAll(): Promise<Goal[]> {
    return db.goals.toArray();
  },

  async create(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const completedAt = goal.status === 'completed' ? goal.completedAt ?? now : undefined;

    await db.goals.add({
      ...goal,
      id,
      createdAt: now,
      updatedAt: now,
      completedAt,
    });

    return id;
  },

  async update(id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>): Promise<void> {
    await db.goals.update(id, withUpdatedMetadata(updates));
  },

  async delete(id: string): Promise<void> {
    await db.goals.delete(id);
  },

  async addChecklistItem(goalId: string, text: string): Promise<void> {
    const goal = await db.goals.get(goalId);
    if (!goal) return;

    const now = new Date().toISOString();
    const item: ChecklistItem = { id: crypto.randomUUID(), text, completed: false };
    await db.goals.update(goalId, {
      checklist: [...goal.checklist, item],
      updatedAt: now,
    });
  },

  async toggleChecklistItem(goalId: string, itemId: string): Promise<void> {
    const goal = await db.goals.get(goalId);
    if (!goal) return;

    const updatedChecklist = goal.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    await db.goals.update(goalId, {
      checklist: updatedChecklist,
      updatedAt: new Date().toISOString(),
    });
  },

  async removeChecklistItem(goalId: string, itemId: string): Promise<void> {
    const goal = await db.goals.get(goalId);
    if (!goal) return;

    await db.goals.update(goalId, {
      checklist: goal.checklist.filter((item) => item.id !== itemId),
      updatedAt: new Date().toISOString(),
    });
  },
};
