import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGoals } from './useGoals';
import { goalRepo } from '../repo/goalRepo';
import type { Goal } from '@/types';

// Mock the goalRepo
vi.mock('../repo/goalRepo', () => ({
  goalRepo: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    addChecklistItem: vi.fn(),
    toggleChecklistItem: vi.fn(),
    removeChecklistItem: vi.fn(),
  },
}));

// Mock useLiveQuery
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}));

const mockGoals: Goal[] = [
  {
    id: 'goal-1',
    title: 'Triple Crown Hu Tao',
    description: 'Max out all talents for Hu Tao',
    category: 'character',
    status: 'in_progress',
    linkedCharacterKey: 'HuTao',
    linkedTeamId: null,
    checklist: [
      { id: 'c1', text: 'Level 10 Normal Attack', completed: true },
      { id: 'c2', text: 'Level 10 Skill', completed: true },
      { id: 'c3', text: 'Level 10 Burst', completed: false },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'goal-2',
    title: 'Build National Team',
    description: 'Complete the National team setup',
    category: 'team',
    status: 'not_started',
    linkedCharacterKey: null,
    linkedTeamId: 'team-national',
    checklist: [
      { id: 'c1', text: 'Build Xiangling', completed: false },
      { id: 'c2', text: 'Build Xingqiu', completed: false },
    ],
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 'goal-3',
    title: 'Farm Emblem Domain',
    description: 'Get good Emblem artifacts',
    category: 'farming',
    status: 'completed',
    linkedCharacterKey: null,
    linkedTeamId: null,
    checklist: [
      { id: 'c1', text: 'Get Sands', completed: true },
      { id: 'c2', text: 'Get Goblet', completed: true },
    ],
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
];

describe('useGoals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('data loading', () => {
    it('returns empty array when loading', async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(undefined);

      const { result } = renderHook(() => useGoals());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.goals).toEqual([]);
      expect(result.current.allGoals).toEqual([]);
    });

    it('returns goals when loaded', async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockGoals);

      const { result } = renderHook(() => useGoals());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.allGoals).toHaveLength(3);
    });
  });

  describe('sorting', () => {
    it('sorts by updatedAt descending', async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockGoals);

      const { result } = renderHook(() => useGoals());

      // Most recently updated first
      expect(result.current.goals[0].title).toBe('Farm Emblem Domain'); // Jan 20
      expect(result.current.goals[1].title).toBe('Triple Crown Hu Tao'); // Jan 15
      expect(result.current.goals[2].title).toBe('Build National Team'); // Jan 10
    });
  });

  describe('filtering by category', () => {
    beforeEach(async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockGoals);
    });

    it('filters by character category', () => {
      const { result } = renderHook(() => useGoals({ category: 'character' }));

      expect(result.current.goals).toHaveLength(1);
      expect(result.current.goals[0].category).toBe('character');
    });

    it('filters by team category', () => {
      const { result } = renderHook(() => useGoals({ category: 'team' }));

      expect(result.current.goals).toHaveLength(1);
      expect(result.current.goals[0].category).toBe('team');
    });

    it('filters by farming category', () => {
      const { result } = renderHook(() => useGoals({ category: 'farming' }));

      expect(result.current.goals).toHaveLength(1);
      expect(result.current.goals[0].category).toBe('farming');
    });
  });

  describe('filtering by status', () => {
    beforeEach(async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockGoals);
    });

    it('filters by in_progress status', () => {
      const { result } = renderHook(() => useGoals({ status: 'in_progress' }));

      expect(result.current.goals).toHaveLength(1);
      expect(result.current.goals[0].status).toBe('in_progress');
    });

    it('filters by not_started status', () => {
      const { result } = renderHook(() => useGoals({ status: 'not_started' }));

      expect(result.current.goals).toHaveLength(1);
      expect(result.current.goals[0].status).toBe('not_started');
    });

    it('filters by completed status', () => {
      const { result } = renderHook(() => useGoals({ status: 'completed' }));

      expect(result.current.goals).toHaveLength(1);
      expect(result.current.goals[0].status).toBe('completed');
    });
  });

  describe('filtering by linked character', () => {
    beforeEach(async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockGoals);
    });

    it('filters by linkedCharacterKey', () => {
      const { result } = renderHook(() =>
        useGoals({ linkedCharacterKey: 'HuTao' })
      );

      expect(result.current.goals).toHaveLength(1);
      expect(result.current.goals[0].linkedCharacterKey).toBe('HuTao');
    });

    it('returns empty when no match', () => {
      const { result } = renderHook(() =>
        useGoals({ linkedCharacterKey: 'Nonexistent' })
      );

      expect(result.current.goals).toHaveLength(0);
    });
  });

  describe('filtering by linked team', () => {
    beforeEach(async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockGoals);
    });

    it('filters by linkedTeamId', () => {
      const { result } = renderHook(() =>
        useGoals({ linkedTeamId: 'team-national' })
      );

      expect(result.current.goals).toHaveLength(1);
      expect(result.current.goals[0].linkedTeamId).toBe('team-national');
    });
  });

  describe('filtering by search', () => {
    beforeEach(async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockGoals);
    });

    it('searches in title', () => {
      const { result } = renderHook(() => useGoals({ search: 'hu tao' }));

      expect(result.current.goals).toHaveLength(1);
      expect(result.current.goals[0].title).toContain('Hu Tao');
    });

    it('searches in description', () => {
      const { result } = renderHook(() => useGoals({ search: 'talents' }));

      expect(result.current.goals).toHaveLength(1);
      expect(result.current.goals[0].description).toContain('talents');
    });

    it('searches in checklist items', () => {
      const { result } = renderHook(() => useGoals({ search: 'xiangling' }));

      expect(result.current.goals).toHaveLength(1);
      expect(result.current.goals[0].title).toBe('Build National Team');
    });

    it('search is case insensitive', () => {
      const { result } = renderHook(() => useGoals({ search: 'EMBLEM' }));

      expect(result.current.goals).toHaveLength(1);
    });
  });

  describe('combining filters', () => {
    beforeEach(async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockGoals);
    });

    it('combines category and status filters', () => {
      const { result } = renderHook(() =>
        useGoals({ category: 'character', status: 'in_progress' })
      );

      expect(result.current.goals).toHaveLength(1);
      expect(result.current.goals[0].category).toBe('character');
      expect(result.current.goals[0].status).toBe('in_progress');
    });

    it('returns empty when combined filters match nothing', () => {
      const { result } = renderHook(() =>
        useGoals({ category: 'farming', status: 'in_progress' })
      );

      expect(result.current.goals).toHaveLength(0);
    });
  });

  describe('CRUD operations', () => {
    beforeEach(async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockGoals);
    });

    it('provides createGoal function', () => {
      const { result } = renderHook(() => useGoals());
      expect(typeof result.current.createGoal).toBe('function');
    });

    it('provides updateGoal function', () => {
      const { result } = renderHook(() => useGoals());
      expect(typeof result.current.updateGoal).toBe('function');
    });

    it('provides deleteGoal function', () => {
      const { result } = renderHook(() => useGoals());
      expect(typeof result.current.deleteGoal).toBe('function');
    });

    it('calls repo.create when createGoal is called', async () => {
      vi.mocked(goalRepo.create).mockResolvedValue('new-goal-id');

      const { result } = renderHook(() => useGoals());
      const newGoal = {
        title: 'New Goal',
        description: 'A new goal',
        category: 'general' as const,
        status: 'not_started' as const,
        linkedCharacterKey: null,
        linkedTeamId: null,
        checklist: [],
      };

      await result.current.createGoal(newGoal);

      expect(goalRepo.create).toHaveBeenCalledWith(newGoal);
    });

    it('calls repo.update when updateGoal is called', async () => {
      vi.mocked(goalRepo.update).mockResolvedValue();

      const { result } = renderHook(() => useGoals());

      await result.current.updateGoal('goal-1', { status: 'completed' });

      expect(goalRepo.update).toHaveBeenCalledWith('goal-1', { status: 'completed' });
    });

    it('calls repo.delete when deleteGoal is called', async () => {
      vi.mocked(goalRepo.delete).mockResolvedValue();

      const { result } = renderHook(() => useGoals());

      await result.current.deleteGoal('goal-1');

      expect(goalRepo.delete).toHaveBeenCalledWith('goal-1');
    });
  });

  describe('checklist operations', () => {
    beforeEach(async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockGoals);
    });

    it('provides addChecklistItem function', () => {
      const { result } = renderHook(() => useGoals());
      expect(result.current.addChecklistItem).toBe(goalRepo.addChecklistItem);
    });

    it('provides toggleChecklistItem function', () => {
      const { result } = renderHook(() => useGoals());
      expect(result.current.toggleChecklistItem).toBe(goalRepo.toggleChecklistItem);
    });

    it('provides removeChecklistItem function', () => {
      const { result } = renderHook(() => useGoals());
      expect(result.current.removeChecklistItem).toBe(goalRepo.removeChecklistItem);
    });
  });
});
