import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMaterials } from './useMaterials';
import { materialRepo } from '@/features/roster/repo/inventoryRepo';

// Mock the materialRepo
vi.mock('@/features/roster/repo/inventoryRepo', () => ({
  materialRepo: {
    get: vi.fn(),
    setMaterial: vi.fn(),
  },
}));

const mockMaterialData = {
  materials: {
    'mora': 5000000,
    'heros-wit': 200,
    'mystic-enhancement-ore': 150,
    'slime-condensate': 50,
    'slime-secretions': 30,
  },
};

describe('useMaterials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(materialRepo.get).mockResolvedValue(mockMaterialData);
    vi.mocked(materialRepo.setMaterial).mockResolvedValue(undefined);
  });

  describe('data loading', () => {
    it('starts with loading state', () => {
      const { result } = renderHook(() => useMaterials());

      expect(result.current.isLoading).toBe(true);
    });

    it('loads materials from repository', async () => {
      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(materialRepo.get).toHaveBeenCalled();
      expect(result.current.materials).toEqual(mockMaterialData.materials);
    });

    it('handles loading error', async () => {
      vi.mocked(materialRepo.get).mockRejectedValue(new Error('DB Error'));

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('DB Error');
    });

    it('handles null data', async () => {
      vi.mocked(materialRepo.get).mockResolvedValue(null);

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.materials).toEqual({});
    });
  });

  describe('material values', () => {
    it('returns correct mora count', async () => {
      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.materials['mora']).toBe(5000000);
    });

    it('returns correct material counts', async () => {
      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.materials['heros-wit']).toBe(200);
      expect(result.current.materials['mystic-enhancement-ore']).toBe(150);
    });
  });

  describe('computed values', () => {
    it('calculates totalMaterialTypes correctly', async () => {
      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.totalMaterialTypes).toBe(5);
    });

    it('returns hasMaterials true when materials exist', async () => {
      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasMaterials).toBe(true);
    });

    it('returns hasMaterials false when no materials', async () => {
      vi.mocked(materialRepo.get).mockResolvedValue({ materials: {} });

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasMaterials).toBe(false);
      expect(result.current.totalMaterialTypes).toBe(0);
    });
  });

  describe('setMaterial', () => {
    it('provides setMaterial function', async () => {
      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.setMaterial).toBe('function');
    });

    it('updates material count', async () => {
      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setMaterial('mora', 6000000);
      });

      expect(materialRepo.setMaterial).toHaveBeenCalledWith('mora', 6000000);
      expect(result.current.materials['mora']).toBe(6000000);
    });

    it('adds new material', async () => {
      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setMaterial('new-material', 100);
      });

      expect(materialRepo.setMaterial).toHaveBeenCalledWith('new-material', 100);
      expect(result.current.materials['new-material']).toBe(100);
    });

    it('handles setMaterial error', async () => {
      vi.mocked(materialRepo.setMaterial).mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setMaterial('mora', 100);
      });

      expect(result.current.error).toBe('Update failed');
    });
  });

  describe('callback stability', () => {
    it('setMaterial callback is stable across renders', async () => {
      const { result, rerender } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const firstSetMaterial = result.current.setMaterial;

      rerender();

      expect(result.current.setMaterial).toBe(firstSetMaterial);
    });
  });

  describe('concurrent operations', () => {
    it('handles multiple setMaterial calls', async () => {
      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await Promise.all([
          result.current.setMaterial('mora', 1000),
          result.current.setMaterial('heros-wit', 50),
          result.current.setMaterial('new-item', 25),
        ]);
      });

      expect(materialRepo.setMaterial).toHaveBeenCalledTimes(3);
      expect(result.current.materials['mora']).toBe(1000);
      expect(result.current.materials['heros-wit']).toBe(50);
      expect(result.current.materials['new-item']).toBe(25);
    });
  });
});
