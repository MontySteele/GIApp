import type { Character, Team } from '@/types';

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

export interface SingleTeamSnapshot {
  format: 'TeamSnapshot';
  version: number;
  exportedAt: string;
  team: {
    id: string;
    name: string;
    characterKeys: string[];
    rotationNotes: string;
    tags: string[];
  };
  members: Array<{
    id: string;
    key: string;
    level: number;
    ascension: number;
    constellation: number;
    talent: Character['talent'];
    weapon: Character['weapon'];
    priority: Character['priority'];
    notes: string;
  }>;
}

export function createTeamSnapshot(team: Team, characters: Character[]): SingleTeamSnapshot {
  const members = characters
    .filter((character) => character.teamIds.includes(team.id) && !character.deletedAt)
    .map((character) => ({
      id: character.id,
      key: character.key,
      level: character.level,
      ascension: character.ascension,
      constellation: character.constellation,
      talent: character.talent,
      weapon: character.weapon,
      priority: character.priority,
      notes: character.notes,
    }));

  return {
    format: 'TeamSnapshot',
    version: 1,
    exportedAt: new Date().toISOString(),
    team: {
      id: team.id,
      name: team.name,
      characterKeys: team.characterKeys,
      rotationNotes: team.rotationNotes,
      tags: team.tags,
    },
    members,
  };
}

export function stringifyTeamSnapshot(snapshot: SingleTeamSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}
