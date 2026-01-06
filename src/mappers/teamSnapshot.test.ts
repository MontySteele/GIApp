import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTeamSnapshot, stringifyTeamSnapshot } from './teamSnapshot';
import type { Character, Team } from '@/types';

const mockTeam: Team = {
  id: 'team-1',
  name: 'Hyperbloom',
  characterKeys: ['Nahida', 'Yelan', 'KukiShinobu'],
  rotationNotes: 'Spread into burst windows',
  tags: ['abyss', 'dps'],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
};

const mockCharacters: Character[] = [
  {
    id: 'char-1',
    key: 'Nahida',
    level: 90,
    ascension: 6,
    constellation: 2,
    talent: { auto: 1, skill: 10, burst: 9 },
    weapon: { key: 'AThousandFloatingDreams', level: 90, ascension: 6, refinement: 1 },
    artifacts: [
      {
        setKey: 'DeepwoodMemories',
        slotKey: 'flower',
        level: 20,
        rarity: 5,
        mainStatKey: 'hp',
        substats: [],
      },
    ],
    notes: 'Focus on EM',
    priority: 'main',
    teamIds: ['team-1'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 'char-2',
    key: 'Xingqiu',
    level: 90,
    ascension: 6,
    constellation: 6,
    talent: { auto: 1, skill: 9, burst: 9 },
    weapon: { key: 'SacrificialSword', level: 90, ascension: 6, refinement: 3 },
    artifacts: [],
    notes: '',
    priority: 'secondary',
    teamIds: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];

describe('team snapshot export', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-02-01T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create a snapshot with team metadata and matching members', () => {
    const snapshot = createTeamSnapshot(mockTeam, mockCharacters);

    expect(snapshot.format).toBe('TeamSnapshot');
    expect(snapshot.version).toBe(1);
    expect(snapshot.exportedAt).toBe('2024-02-01T12:00:00.000Z');
    expect(snapshot.team).toEqual({
      id: 'team-1',
      name: 'Hyperbloom',
      characterKeys: ['Nahida', 'Yelan', 'KukiShinobu'],
      rotationNotes: 'Spread into burst windows',
      tags: ['abyss', 'dps'],
    });
    expect(snapshot.members).toHaveLength(1);
    expect(snapshot.members[0]).toMatchObject({
      id: 'char-1',
      key: 'Nahida',
      level: 90,
      ascension: 6,
      constellation: 2,
      talent: { auto: 1, skill: 10, burst: 9 },
      weapon: { key: 'AThousandFloatingDreams', level: 90, ascension: 6, refinement: 1 },
      priority: 'main',
      notes: 'Focus on EM',
    });
  });

  it('should stringify snapshot to pretty JSON', () => {
    const snapshot = createTeamSnapshot(mockTeam, mockCharacters);
    const json = stringifyTeamSnapshot(snapshot);

    const parsed = JSON.parse(json);
    expect(parsed).toEqual(snapshot);
    expect(json).toContain('\n  "format": "TeamSnapshot"');
  });
});
