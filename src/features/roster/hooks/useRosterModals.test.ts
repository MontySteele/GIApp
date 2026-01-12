import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRosterModals } from './useRosterModals';
import type { Character, Team } from '@/types';

const mockCharacter: Character = {
  id: 'char-1',
  key: 'Hu Tao',
  name: 'Hu Tao',
  level: 90,
  ascension: 6,
  constellation: 1,
  element: 'Pyro',
  weaponType: 'Polearm',
  rarity: 5,
  talents: { normal: 10, skill: 10, burst: 10 },
  priority: 'high',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockTeam: Team = {
  id: 'team-1',
  name: 'Hu Tao Vape',
  members: ['Hu Tao', 'Xingqiu', 'Zhongli', 'Yelan'],
  description: 'Vaporize team',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('useRosterModals', () => {
  describe('initial state', () => {
    it('has all modals closed initially', () => {
      const { result } = renderHook(() => useRosterModals());

      expect(result.current.showAddModal).toBe(false);
      expect(result.current.editingCharacter).toBeNull();
      expect(result.current.deletingCharacter).toBeNull();
      expect(result.current.exportModalView).toBeNull();
      expect(result.current.showTeamModal).toBe(false);
      expect(result.current.activeTeam).toBeNull();
      expect(result.current.deletingTeam).toBeNull();
    });

    it('has default team modal mode as create', () => {
      const { result } = renderHook(() => useRosterModals());

      expect(result.current.teamModalMode).toBe('create');
    });
  });

  describe('add character modal', () => {
    it('opens add modal', () => {
      const { result } = renderHook(() => useRosterModals());

      act(() => {
        result.current.openAddModal();
      });

      expect(result.current.showAddModal).toBe(true);
    });

    it('closes add modal', () => {
      const { result } = renderHook(() => useRosterModals());

      act(() => {
        result.current.openAddModal();
      });

      act(() => {
        result.current.closeAddModal();
      });

      expect(result.current.showAddModal).toBe(false);
    });
  });

  describe('edit character modal', () => {
    it('opens edit modal with character', () => {
      const { result } = renderHook(() => useRosterModals());

      act(() => {
        result.current.openEditModal(mockCharacter);
      });

      expect(result.current.editingCharacter).toEqual(mockCharacter);
    });

    it('closes edit modal and clears character', () => {
      const { result } = renderHook(() => useRosterModals());

      act(() => {
        result.current.openEditModal(mockCharacter);
      });

      act(() => {
        result.current.closeEditModal();
      });

      expect(result.current.editingCharacter).toBeNull();
    });
  });

  describe('delete character modal', () => {
    it('opens delete modal with character', () => {
      const { result } = renderHook(() => useRosterModals());

      act(() => {
        result.current.openDeleteModal(mockCharacter);
      });

      expect(result.current.deletingCharacter).toEqual(mockCharacter);
    });

    it('closes delete modal and clears character', () => {
      const { result } = renderHook(() => useRosterModals());

      act(() => {
        result.current.openDeleteModal(mockCharacter);
      });

      act(() => {
        result.current.closeDeleteModal();
      });

      expect(result.current.deletingCharacter).toBeNull();
    });
  });

  describe('export modal', () => {
    it('opens export modal with GOOD view', () => {
      const { result } = renderHook(() => useRosterModals());

      act(() => {
        result.current.openExportModal('good');
      });

      expect(result.current.exportModalView).toBe('good');
    });

    it('opens export modal with teams view', () => {
      const { result } = renderHook(() => useRosterModals());

      act(() => {
        result.current.openExportModal('teams');
      });

      expect(result.current.exportModalView).toBe('teams');
    });

    it('closes export modal', () => {
      const { result } = renderHook(() => useRosterModals());

      act(() => {
        result.current.openExportModal('good');
      });

      act(() => {
        result.current.closeExportModal();
      });

      expect(result.current.exportModalView).toBeNull();
    });
  });

  describe('team modal', () => {
    it('opens create team modal', () => {
      const { result } = renderHook(() => useRosterModals());

      act(() => {
        result.current.openCreateTeamModal();
      });

      expect(result.current.showTeamModal).toBe(true);
      expect(result.current.teamModalMode).toBe('create');
      expect(result.current.activeTeam).toBeNull();
    });

    it('opens edit team modal with team', () => {
      const { result } = renderHook(() => useRosterModals());

      act(() => {
        result.current.openEditTeamModal(mockTeam);
      });

      expect(result.current.showTeamModal).toBe(true);
      expect(result.current.teamModalMode).toBe('edit');
      expect(result.current.activeTeam).toEqual(mockTeam);
    });

    it('closes team modal and clears active team', () => {
      const { result } = renderHook(() => useRosterModals());

      act(() => {
        result.current.openEditTeamModal(mockTeam);
      });

      act(() => {
        result.current.closeTeamModal();
      });

      expect(result.current.showTeamModal).toBe(false);
      expect(result.current.activeTeam).toBeNull();
    });
  });

  describe('delete team modal', () => {
    it('opens delete team modal with team', () => {
      const { result } = renderHook(() => useRosterModals());

      act(() => {
        result.current.openDeleteTeamModal(mockTeam);
      });

      expect(result.current.deletingTeam).toEqual(mockTeam);
    });

    it('closes delete team modal and clears team', () => {
      const { result } = renderHook(() => useRosterModals());

      act(() => {
        result.current.openDeleteTeamModal(mockTeam);
      });

      act(() => {
        result.current.closeDeleteTeamModal();
      });

      expect(result.current.deletingTeam).toBeNull();
    });
  });

  describe('multiple modals', () => {
    it('allows multiple modals to be open independently', () => {
      const { result } = renderHook(() => useRosterModals());

      act(() => {
        result.current.openAddModal();
        result.current.openExportModal('good');
      });

      expect(result.current.showAddModal).toBe(true);
      expect(result.current.exportModalView).toBe('good');
    });

    it('closing one modal does not affect others', () => {
      const { result } = renderHook(() => useRosterModals());

      act(() => {
        result.current.openAddModal();
        result.current.openEditModal(mockCharacter);
      });

      act(() => {
        result.current.closeAddModal();
      });

      expect(result.current.showAddModal).toBe(false);
      expect(result.current.editingCharacter).toEqual(mockCharacter);
    });
  });

  describe('state transitions', () => {
    it('handles rapid open/close cycles', () => {
      const { result } = renderHook(() => useRosterModals());

      act(() => {
        result.current.openAddModal();
        result.current.closeAddModal();
        result.current.openAddModal();
        result.current.closeAddModal();
        result.current.openAddModal();
      });

      expect(result.current.showAddModal).toBe(true);
    });

    it('maintains state isolation between different modals', () => {
      const { result } = renderHook(() => useRosterModals());

      const anotherCharacter: Character = { ...mockCharacter, id: 'char-2', name: 'Xiao' };

      act(() => {
        result.current.openEditModal(mockCharacter);
        result.current.openDeleteModal(anotherCharacter);
      });

      expect(result.current.editingCharacter?.id).toBe('char-1');
      expect(result.current.deletingCharacter?.id).toBe('char-2');
    });
  });

  describe('callback stability', () => {
    it('returns stable callback references', () => {
      const { result, rerender } = renderHook(() => useRosterModals());

      const firstOpenAddModal = result.current.openAddModal;
      const firstCloseAddModal = result.current.closeAddModal;

      rerender();

      expect(result.current.openAddModal).toBe(firstOpenAddModal);
      expect(result.current.closeAddModal).toBe(firstCloseAddModal);
    });
  });
});
