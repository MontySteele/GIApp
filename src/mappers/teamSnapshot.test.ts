import { describe, it, expect } from 'vitest';
import { toTeamSnapshot, type TeamSnapshot } from './teamSnapshot';
import type { Team } from '@/types';

const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Hyperbloom',
    characterKeys: ['Nahida', 'Yelan', 'KukiShinobu'],
    rotationNotes: 'Spread into burst windows',
    tags: ['abyss', 'dps'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 'team-2',
    name: 'National',
    characterKeys: ['Xiangling', 'Xingqiu', 'Bennett', 'Raiden'],
    rotationNotes: '',
    tags: ['abyss'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];

describe('team snapshot export', () => {
  it('should create a snapshot with correct format and version', () => {
    const snapshot = toTeamSnapshot(mockTeams);

    expect(snapshot.format).toBe('GIAPP_TEAMS');
    expect(snapshot.version).toBe(1);
    expect(snapshot.source).toBe('Genshin Progress Tracker');
  });

  it('should include all teams with their metadata', () => {
    const snapshot = toTeamSnapshot(mockTeams);

    expect(snapshot.teams).toHaveLength(2);
    expect(snapshot.teams[0]).toEqual({
      id: 'team-1',
      name: 'Hyperbloom',
      characterKeys: ['Nahida', 'Yelan', 'KukiShinobu'],
      rotationNotes: 'Spread into burst windows',
      tags: ['abyss', 'dps'],
      updatedAt: '2024-01-02T00:00:00.000Z',
    });
  });

  it('should handle empty teams array', () => {
    const snapshot = toTeamSnapshot([]);

    expect(snapshot.format).toBe('GIAPP_TEAMS');
    expect(snapshot.teams).toEqual([]);
  });

  it('should only include exported fields, not createdAt', () => {
    const snapshot = toTeamSnapshot(mockTeams);

    // Should include updatedAt but not createdAt
    expect(snapshot.teams[0]).toHaveProperty('updatedAt');
    expect(snapshot.teams[0]).not.toHaveProperty('createdAt');
  });

  it('should stringify snapshot to valid JSON', () => {
    const snapshot = toTeamSnapshot(mockTeams);
    const json = JSON.stringify(snapshot, null, 2);
    const parsed = JSON.parse(json) as TeamSnapshot;

    expect(parsed).toEqual(snapshot);
    expect(parsed.format).toBe('GIAPP_TEAMS');
  });
});
