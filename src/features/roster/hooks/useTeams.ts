import { useLiveQuery } from 'dexie-react-hooks';
import { teamRepo } from '../repo/teamRepo';
import type { Team } from '@/types';

export function useTeams() {
  const teams = useLiveQuery(() => teamRepo.getAll(), []);

  const createTeam = async (team: Omit<Team, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) => {
    return teamRepo.create(team);
  };

  const updateTeam = async (id: string, updates: Partial<Omit<Team, 'id' | 'createdAt' | 'deletedAt'>>) => {
    return teamRepo.update(id, updates);
  };

  const deleteTeam = async (id: string) => {
    return teamRepo.delete(id);
  };

  return {
    teams: teams ?? [],
    createTeam,
    updateTeam,
    deleteTeam,
    isLoading: teams === undefined,
  };
}

export function useTeam(id: string | undefined) {
  const team = useLiveQuery(
    () => (id ? teamRepo.getById(id) : undefined),
    [id]
  );

  return {
    team,
    isLoading: team === undefined && id !== undefined,
  };
}
