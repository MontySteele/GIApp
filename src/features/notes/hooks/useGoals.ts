import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { goalRepo } from '../repo/goalRepo';
import type { Goal, GoalCategory, GoalStatus } from '@/types';

interface GoalQuery {
  category?: GoalCategory;
  status?: GoalStatus;
  search?: string;
  linkedCharacterKey?: string | null;
  linkedTeamId?: string | null;
}

export function useGoals(query?: GoalQuery) {
  const goals = useLiveQuery(() => goalRepo.getAll(), []);

  const filteredGoals = useMemo(() => {
    let results = goals ?? [];

    if (query?.category) {
      results = results.filter((goal) => goal.category === query.category);
    }

    if (query?.status) {
      results = results.filter((goal) => goal.status === query.status);
    }

    if (query?.linkedCharacterKey) {
      results = results.filter((goal) => goal.linkedCharacterKey === query.linkedCharacterKey);
    }

    if (query?.linkedTeamId) {
      results = results.filter((goal) => goal.linkedTeamId === query.linkedTeamId);
    }

    if (query?.search) {
      const search = query.search.toLowerCase();
      results = results.filter(
        (goal) =>
          goal.title.toLowerCase().includes(search) ||
          goal.description.toLowerCase().includes(search) ||
          goal.checklist.some((item) => item.text.toLowerCase().includes(search))
      );
    }

    return [...results].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [
    goals,
    query?.category,
    query?.status,
    query?.linkedCharacterKey,
    query?.linkedTeamId,
    query?.search,
  ]);

  const createGoal = async (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    return goalRepo.create(goal);
  };

  const updateGoal = async (id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>) => {
    return goalRepo.update(id, updates);
  };

  const deleteGoal = async (id: string) => {
    return goalRepo.delete(id);
  };

  return {
    goals: filteredGoals,
    allGoals: goals ?? [],
    createGoal,
    updateGoal,
    deleteGoal,
    addChecklistItem: goalRepo.addChecklistItem,
    toggleChecklistItem: goalRepo.toggleChecklistItem,
    removeChecklistItem: goalRepo.removeChecklistItem,
    isLoading: goals === undefined,
  };
}
