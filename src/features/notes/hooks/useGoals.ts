import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { goalRepo, type GoalQuery } from '../repo/goalRepo';
import type { Goal, GoalStatus } from '@/types';

export function useGoals(filters: GoalQuery = {}) {
  const goals = useLiveQuery(() => goalRepo.query(filters), [
    filters.status instanceof Array ? filters.status.join(',') : filters.status,
    filters.category instanceof Array ? filters.category.join(',') : filters.category,
    filters.linkedCharacterKey,
    filters.linkedTeamId,
    filters.search,
  ]);

  const sortedGoals = useMemo(() => goals ?? [], [goals]);

  const createGoal = async (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>) => {
    return goalRepo.create(goal);
  };

  const updateGoal = async (
    id: string,
    updates: Partial<Omit<Goal, 'id' | 'createdAt' | 'completedAt'>> & { status?: GoalStatus }
  ) => {
    return goalRepo.update(id, updates);
  };

  const deleteGoal = async (id: string) => {
    return goalRepo.delete(id);
  };

  const addChecklistItem = async (goalId: string, text: string) => {
    return goalRepo.addChecklistItem(goalId, text);
  };

  const toggleChecklistItem = async (goalId: string, itemId: string) => {
    return goalRepo.toggleChecklistItem(goalId, itemId);
  };

  const removeChecklistItem = async (goalId: string, itemId: string) => {
    return goalRepo.removeChecklistItem(goalId, itemId);
  };

  const linkToCharacter = async (goalId: string, characterKey?: string) => {
    return goalRepo.update(goalId, { linkedCharacterKey: characterKey });
  };

  const linkToTeam = async (goalId: string, teamId?: string) => {
    return goalRepo.update(goalId, { linkedTeamId: teamId });
  };

  return {
    goals: sortedGoals,
    isLoading: goals === undefined,
    createGoal,
    updateGoal,
    deleteGoal,
    addChecklistItem,
    toggleChecklistItem,
    removeChecklistItem,
    linkToCharacter,
    linkToTeam,
  };
}

export function useGoal(id: string | undefined) {
  const goal = useLiveQuery(() => (id ? goalRepo.getById(id) : undefined), [id]);

  return {
    goal,
    isLoading: goal === undefined && id !== undefined,
  };
}
