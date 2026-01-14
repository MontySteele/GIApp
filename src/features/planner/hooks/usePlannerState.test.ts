import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlannerState } from './usePlannerState';

describe('usePlannerState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('returns default values when no persisted state', () => {
      const { result } = renderHook(() => usePlannerState());

      expect(result.current.plannerMode).toBe('single');
      expect(result.current.selectedCharacterId).toBe('');
      expect(result.current.singleGoalType).toBe('next');
      expect(result.current.multiTab).toBe('characters');
      expect(result.current.multiGoalType).toBe('full');
      expect(result.current.multiSelectedKeys).toEqual([]);
    });

    it('restores persisted state from localStorage', () => {
      localStorage.setItem('plannerState', JSON.stringify({
        mode: 'multi',
        singleGoalType: 'full',
        singleCharacterId: 'char-1',
        multiTab: 'weapons',
        multiGoalType: 'comfortable',
        multiSelectedKeys: ['Furina', 'Neuvillette'],
        weaponGoalType: 'full',
        weaponSelectedIds: [],
      }));

      const { result } = renderHook(() => usePlannerState());

      expect(result.current.plannerMode).toBe('multi');
      expect(result.current.selectedCharacterId).toBe('char-1');
      expect(result.current.singleGoalType).toBe('full');
      expect(result.current.multiTab).toBe('weapons');
      expect(result.current.multiGoalType).toBe('comfortable');
      expect(result.current.multiSelectedKeys).toEqual(['Furina', 'Neuvillette']);
    });

    it('uses URL params to override persisted state', () => {
      localStorage.setItem('plannerState', JSON.stringify({
        mode: 'single',
        singleCharacterId: 'char-1',
      }));

      const { result } = renderHook(() => usePlannerState({
        initialModeFromUrl: 'multi',
        initialCharacterKeysFromUrl: ['Furina'],
      }));

      expect(result.current.plannerMode).toBe('multi');
      expect(result.current.multiSelectedKeys).toEqual(['Furina']);
    });

    it('uses character ID from URL for single mode', () => {
      const { result } = renderHook(() => usePlannerState({
        initialCharacterIdFromUrl: 'char-from-url',
      }));

      expect(result.current.plannerMode).toBe('single');
      expect(result.current.selectedCharacterId).toBe('char-from-url');
    });
  });

  describe('state updates', () => {
    it('updates planner mode', () => {
      const { result } = renderHook(() => usePlannerState());

      act(() => {
        result.current.setPlannerMode('multi');
      });

      expect(result.current.plannerMode).toBe('multi');
    });

    it('updates selected character ID', () => {
      const { result } = renderHook(() => usePlannerState());

      act(() => {
        result.current.setSelectedCharacterId('new-char');
      });

      expect(result.current.selectedCharacterId).toBe('new-char');
    });

    it('updates goal type for single mode', () => {
      const { result } = renderHook(() => usePlannerState());

      act(() => {
        result.current.setSingleGoalType('comfortable');
      });

      expect(result.current.singleGoalType).toBe('comfortable');
    });

    it('updates multi tab', () => {
      const { result } = renderHook(() => usePlannerState());

      act(() => {
        result.current.setMultiTab('weapons');
      });

      expect(result.current.multiTab).toBe('weapons');
    });

    it('updates multi selected keys', () => {
      const { result } = renderHook(() => usePlannerState());

      act(() => {
        result.current.setMultiSelectedKeys(['Furina', 'Neuvillette']);
      });

      expect(result.current.multiSelectedKeys).toEqual(['Furina', 'Neuvillette']);
    });
  });

  describe('persistence', () => {
    it('persists state changes to localStorage', () => {
      const { result } = renderHook(() => usePlannerState());

      act(() => {
        result.current.setPlannerMode('multi');
        result.current.setMultiSelectedKeys(['Furina']);
      });

      const saved = JSON.parse(localStorage.getItem('plannerState') || '{}');
      expect(saved.mode).toBe('multi');
      expect(saved.multiSelectedKeys).toEqual(['Furina']);
    });

    it('handles corrupted localStorage gracefully', () => {
      localStorage.setItem('plannerState', 'not valid json');

      const { result } = renderHook(() => usePlannerState());

      expect(result.current.plannerMode).toBe('single');
      expect(result.current.multiSelectedKeys).toEqual([]);
    });

    it('handles partial persisted state', () => {
      localStorage.setItem('plannerState', JSON.stringify({
        mode: 'multi',
        // Missing other fields
      }));

      const { result } = renderHook(() => usePlannerState());

      expect(result.current.plannerMode).toBe('multi');
      expect(result.current.singleGoalType).toBe('next'); // Default
      expect(result.current.multiSelectedKeys).toEqual([]); // Default
    });
  });
});
