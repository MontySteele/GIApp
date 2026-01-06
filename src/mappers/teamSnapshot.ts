import type { Character, Team } from '@/types';

export interface TeamSnapshotMember {
  id: string;
  key: string;
  level: number;
  ascension: number;
  constellation: number;
  talent: Character['talent'];
  weapon: Character['weapon'];
  artifacts: Character['artifacts'];
  notes: string;
  priority: Character['priority'];
}

export interface TeamSnapshot {
  format: 'TeamSnapshot';
  version: 1;
  exportedAt: string;
  team: Pick<Team, 'id' | 'name' | 'characterKeys' | 'rotationNotes' | 'tags'>;
  members: TeamSnapshotMember[];
}

export function createTeamSnapshot(team: Team, characters: Character[]): TeamSnapshot {
  const memberKeys = new Set(team.characterKeys);
  const members = characters
    .filter((char) => char.teamIds?.includes(team.id) || memberKeys.has(char.key))
    .map((char) => ({
      id: char.id,
      key: char.key,
      level: char.level,
      ascension: char.ascension,
      constellation: char.constellation,
      talent: char.talent,
      weapon: char.weapon,
      artifacts: char.artifacts,
      notes: char.notes,
      priority: char.priority,
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

export function stringifyTeamSnapshot(snapshot: TeamSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}
