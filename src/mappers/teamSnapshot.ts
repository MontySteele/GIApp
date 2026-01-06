import type { Team } from '@/types';

export interface TeamSnapshot {
  format: 'GIAPP_TEAMS';
  version: number;
  source: string;
  teams: Array<{
    id: string;
    name: string;
    characterKeys: string[];
    rotationNotes: string;
    tags: string[];
    updatedAt: string;
  }>;
}

export function toTeamSnapshot(teams: Team[]): TeamSnapshot {
  return {
    format: 'GIAPP_TEAMS',
    version: 1,
    source: 'Genshin Progress Tracker',
    teams: teams.map((team) => ({
      id: team.id,
      name: team.name,
      characterKeys: team.characterKeys,
      rotationNotes: team.rotationNotes,
      tags: team.tags,
      updatedAt: team.updatedAt,
    })),
  };
}
