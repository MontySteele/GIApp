import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useArtifacts } from './useArtifacts';
import { artifactRepo } from '../repo/artifactRepo';
import { scoreInventoryArtifact } from '../domain/artifactScoring';
import type { InventoryArtifact } from '@/types';

// Mock dependencies
vi.mock('../repo/artifactRepo', () => ({
  artifactRepo: {
    getAll: vi.fn(),
  },
}));

vi.mock('../domain/artifactScoring', () => ({
  scoreInventoryArtifact: vi.fn(),
}));

const mockArtifacts: InventoryArtifact[] = [
  {
    id: 'art-1',
    setKey: 'CrimsonWitchOfFlames',
    slotKey: 'flower',
    rarity: 5,
    level: 20,
    mainStatKey: 'hp',
    substats: [
      { key: 'critRate_', value: 10.5 },
      { key: 'critDMG_', value: 21.0 },
      { key: 'atk_', value: 5.8 },
      { key: 'energyRecharge_', value: 5.2 },
    ],
    location: 'HuTao',
    lock: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'art-2',
    setKey: 'CrimsonWitchOfFlames',
    slotKey: 'sands',
    rarity: 5,
    level: 16,
    mainStatKey: 'hp_',
    substats: [
      { key: 'critRate_', value: 3.5 },
      { key: 'atk', value: 19 },
      { key: 'def_', value: 7.3 },
      { key: 'def', value: 23 },
    ],
    location: '',
    lock: false,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 'art-3',
    setKey: 'EmblemOfSeveredFate',
    slotKey: 'flower',
    rarity: 4,
    level: 12,
    mainStatKey: 'hp',
    substats: [
      { key: 'def', value: 16 },
      { key: 'def_', value: 5.8 },
    ],
    location: '',
    lock: false,
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-08T00:00:00Z',
  },
];

const mockScores = {
  'art-1': {
    score: 85,
    critValue: 31.5,
    grade: 'A' as const,
    isStrongboxTrash: false,
  },
  'art-2': {
    score: 45,
    critValue: 7.0,
    grade: 'C' as const,
    isStrongboxTrash: false,
  },
  'art-3': {
    score: 20,
    critValue: 0,
    grade: 'F' as const,
    isStrongboxTrash: true,
  },
};

describe('useArtifacts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(artifactRepo.getAll).mockResolvedValue(mockArtifacts);
    vi.mocked(scoreInventoryArtifact).mockImplementation((artifact) => {
      return mockScores[artifact.id as keyof typeof mockScores];
    });
  });

  describe('data loading', () => {
    it('starts with loading state', () => {
      const { result } = renderHook(() => useArtifacts());

      expect(result.current.isLoading).toBe(true);
    });

    it('loads artifacts from repository', async () => {
      const { result } = renderHook(() => useArtifacts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(artifactRepo.getAll).toHaveBeenCalled();
      expect(result.current.allArtifacts).toHaveLength(3);
    });

    it('handles loading error', async () => {
      vi.mocked(artifactRepo.getAll).mockRejectedValue(new Error('DB Error'));

      const { result } = renderHook(() => useArtifacts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('DB Error');
    });
  });

  describe('scoring', () => {
    it('scores all artifacts', async () => {
      const { result } = renderHook(() => useArtifacts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(scoreInventoryArtifact).toHaveBeenCalledTimes(3);
      expect(result.current.allArtifacts[0].score).toBeDefined();
    });

    it('includes score in artifact data', async () => {
      const { result } = renderHook(() => useArtifacts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const art1 = result.current.allArtifacts.find((a) => a.id === 'art-1');
      expect(art1?.score.score).toBe(85);
      expect(art1?.score.grade).toBe('A');
    });
  });

  describe('filtering', () => {
    it('filters by set key', async () => {
      const { result } = renderHook(() =>
        useArtifacts({ filters: { setKey: 'CrimsonWitchOfFlames' } })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.artifacts).toHaveLength(2);
      expect(result.current.artifacts.every((a) => a.setKey === 'CrimsonWitchOfFlames')).toBe(
        true
      );
    });

    it('filters by slot key', async () => {
      const { result } = renderHook(() =>
        useArtifacts({ filters: { slotKey: 'flower' } })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.artifacts).toHaveLength(2);
      expect(result.current.artifacts.every((a) => a.slotKey === 'flower')).toBe(true);
    });

    it('filters by rarity', async () => {
      const { result } = renderHook(() =>
        useArtifacts({ filters: { rarity: 5 } })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.artifacts).toHaveLength(2);
      expect(result.current.artifacts.every((a) => a.rarity === 5)).toBe(true);
    });

    it('filters by main stat', async () => {
      const { result } = renderHook(() =>
        useArtifacts({ filters: { mainStatKey: 'hp' } })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.artifacts).toHaveLength(2);
    });

    it('filters equipped artifacts', async () => {
      const { result } = renderHook(() =>
        useArtifacts({ filters: { equipped: true } })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.artifacts).toHaveLength(1);
      expect(result.current.artifacts[0].location).toBe('HuTao');
    });

    it('filters unequipped artifacts', async () => {
      const { result } = renderHook(() =>
        useArtifacts({ filters: { equipped: false } })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.artifacts).toHaveLength(2);
      expect(result.current.artifacts.every((a) => a.location === '')).toBe(true);
    });

    it('filters locked artifacts', async () => {
      const { result } = renderHook(() =>
        useArtifacts({ filters: { locked: true } })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.artifacts).toHaveLength(1);
      expect(result.current.artifacts[0].lock).toBe(true);
    });

    it('filters trash only', async () => {
      const { result } = renderHook(() =>
        useArtifacts({ filters: { trashOnly: true } })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.artifacts).toHaveLength(1);
      expect(result.current.artifacts[0].score.isStrongboxTrash).toBe(true);
    });
  });

  describe('sorting', () => {
    it('sorts by score descending', async () => {
      const { result } = renderHook(() =>
        useArtifacts({ sort: { field: 'score', direction: 'desc' } })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.artifacts[0].score.score).toBe(85);
      expect(result.current.artifacts[2].score.score).toBe(20);
    });

    it('sorts by score ascending', async () => {
      const { result } = renderHook(() =>
        useArtifacts({ sort: { field: 'score', direction: 'asc' } })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.artifacts[0].score.score).toBe(20);
      expect(result.current.artifacts[2].score.score).toBe(85);
    });

    it('sorts by crit value', async () => {
      const { result } = renderHook(() =>
        useArtifacts({ sort: { field: 'critValue', direction: 'desc' } })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.artifacts[0].score.critValue).toBe(31.5);
    });

    it('sorts by level', async () => {
      const { result } = renderHook(() =>
        useArtifacts({ sort: { field: 'level', direction: 'desc' } })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.artifacts[0].level).toBe(20);
      expect(result.current.artifacts[2].level).toBe(12);
    });

    it('sorts by rarity', async () => {
      const { result } = renderHook(() =>
        useArtifacts({ sort: { field: 'rarity', direction: 'desc' } })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.artifacts[0].rarity).toBe(5);
      expect(result.current.artifacts[2].rarity).toBe(4);
    });
  });

  describe('stats', () => {
    it('calculates total artifacts', async () => {
      const { result } = renderHook(() => useArtifacts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats.total).toBe(3);
    });

    it('calculates trash count', async () => {
      const { result } = renderHook(() => useArtifacts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats.trash).toBe(1);
    });

    it('calculates equipped count', async () => {
      const { result } = renderHook(() => useArtifacts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats.equipped).toBe(1);
      expect(result.current.stats.unequipped).toBe(2);
    });

    it('calculates five star count', async () => {
      const { result } = renderHook(() => useArtifacts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats.fiveStar).toBe(2);
    });

    it('calculates grade distribution', async () => {
      const { result } = renderHook(() => useArtifacts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats.grades.A).toBe(1);
      expect(result.current.stats.grades.C).toBe(1);
      expect(result.current.stats.grades.F).toBe(1);
    });
  });
});
