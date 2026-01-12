import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTeams, useTeam } from './useTeams';
import { teamRepo } from '../repo/teamRepo';
import type { Team } from '@/types';

// Mock the teamRepo
vi.mock('../repo/teamRepo', () => ({
  teamRepo: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock useLiveQuery
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}));

const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Hu Tao Vape',
    members: ['HuTao', 'Xingqiu', 'Zhongli', 'Yelan'],
    description: 'Double hydro vaporize team',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'team-2',
    name: 'National Team',
    members: ['XiangLing', 'Xingqiu', 'Bennett', 'Raiden'],
    description: 'Classic national team',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'team-3',
    name: 'Freeze Team',
    members: ['Ayaka', 'Shenhe', 'Kazuha', 'Kokomi'],
    description: 'Ayaka freeze composition',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('useTeams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('data loading', () => {
    it('returns empty array when loading', async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(undefined);

      const { result } = renderHook(() => useTeams());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.teams).toEqual([]);
    });

    it('returns teams when loaded', async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockTeams);

      const { result } = renderHook(() => useTeams());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.teams).toHaveLength(3);
    });
  });

  describe('CRUD operations', () => {
    beforeEach(async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockTeams);
    });

    it('provides createTeam function', () => {
      const { result } = renderHook(() => useTeams());
      expect(typeof result.current.createTeam).toBe('function');
    });

    it('provides updateTeam function', () => {
      const { result } = renderHook(() => useTeams());
      expect(typeof result.current.updateTeam).toBe('function');
    });

    it('provides deleteTeam function', () => {
      const { result } = renderHook(() => useTeams());
      expect(typeof result.current.deleteTeam).toBe('function');
    });

    it('calls repo.create when createTeam is called', async () => {
      vi.mocked(teamRepo.create).mockResolvedValue('new-team-id');

      const { result } = renderHook(() => useTeams());
      const newTeam = {
        name: 'New Team',
        members: ['Character1', 'Character2'],
        description: 'A new team',
      };

      await result.current.createTeam(newTeam);

      expect(teamRepo.create).toHaveBeenCalledWith(newTeam);
    });

    it('calls repo.update when updateTeam is called', async () => {
      vi.mocked(teamRepo.update).mockResolvedValue();

      const { result } = renderHook(() => useTeams());

      await result.current.updateTeam('team-1', { name: 'Updated Name' });

      expect(teamRepo.update).toHaveBeenCalledWith('team-1', { name: 'Updated Name' });
    });

    it('calls repo.delete when deleteTeam is called', async () => {
      vi.mocked(teamRepo.delete).mockResolvedValue();

      const { result } = renderHook(() => useTeams());

      await result.current.deleteTeam('team-1');

      expect(teamRepo.delete).toHaveBeenCalledWith('team-1');
    });
  });

  describe('team data', () => {
    it('returns all team data correctly', async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockTeams);

      const { result } = renderHook(() => useTeams());

      const huTaoTeam = result.current.teams.find((t) => t.name === 'Hu Tao Vape');
      expect(huTaoTeam).toBeDefined();
      expect(huTaoTeam?.members).toHaveLength(4);
      expect(huTaoTeam?.members).toContain('HuTao');
    });
  });
});

describe('useTeam', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns undefined when id is undefined', async () => {
    const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
    useLiveQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useTeam(undefined));

    expect(result.current.team).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('returns team when found', async () => {
    const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
    useLiveQuery.mockReturnValue(mockTeams[0]);

    const { result } = renderHook(() => useTeam('team-1'));

    expect(result.current.team).toEqual(mockTeams[0]);
    expect(result.current.isLoading).toBe(false);
  });

  it('shows loading when id provided but team not yet loaded', async () => {
    const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
    useLiveQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useTeam('team-1'));

    expect(result.current.isLoading).toBe(true);
  });
});
