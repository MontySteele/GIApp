import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCampaignActionStates, type CampaignActionState } from './useCampaignActionStates';

const STORAGE_KEY = 'campaignActionStates:v1';

function actionInput(actionKey: string) {
  return {
    actionKey,
    campaignId: 'campaign-1',
    actionId: actionKey,
    actionLabel: `Action ${actionKey}`,
  };
}

function readActivities() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  return JSON.parse(stored) as {
    activities: Array<{
      actionKey: string;
      state: CampaignActionState;
      dateKey: string;
      actionLabel: string;
    }>;
  };
}

describe('useCampaignActionStates', () => {
  beforeEach(() => {
    let id = 0;
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-11T12:00:00.000Z'));
    vi.spyOn(crypto, 'randomUUID').mockImplementation(
      () => `activity-${++id}` as ReturnType<Crypto['randomUUID']>
    );
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts fresh when localStorage contains malformed state', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');

    const { result } = renderHook(() => useCampaignActionStates());

    expect(result.current.todayActivities).toEqual([]);
    expect(result.current.getActionState('action-1')).toBeUndefined();

    act(() => {
      result.current.setActionState('done', actionInput('action-1'));
    });

    expect(readActivities().activities).toHaveLength(1);
    expect(readActivities().activities[0]).toMatchObject({
      actionKey: 'action-1',
      state: 'done',
      dateKey: '2026-05-11',
    });
  });

  it('rolls daily activity state over by date key', () => {
    vi.setSystemTime(new Date('2026-05-10T12:00:00.000Z'));
    const { result, rerender } = renderHook(() => useCampaignActionStates());

    act(() => {
      result.current.setActionState('done', actionInput('action-1'));
    });

    expect(result.current.getActionState('action-1')?.dateKey).toBe('2026-05-10');

    vi.setSystemTime(new Date('2026-05-11T12:00:00.000Z'));
    rerender();

    expect(result.current.todayActivities).toEqual([]);
    expect(result.current.getActionState('action-1')).toBeUndefined();

    act(() => {
      result.current.setActionState('snoozed', actionInput('action-1'));
    });

    expect(result.current.todayActivities).toHaveLength(1);
    expect(result.current.todayActivities[0]).toMatchObject({
      actionKey: 'action-1',
      state: 'snoozed',
      dateKey: '2026-05-11',
    });
    expect(readActivities().activities).toHaveLength(2);
  });

  it('caps stored activity history at 100 records', () => {
    const { result } = renderHook(() => useCampaignActionStates());

    act(() => {
      for (let index = 0; index < 105; index += 1) {
        result.current.setActionState('done', actionInput(`action-${index}`));
      }
    });

    const activities = readActivities().activities;
    expect(activities).toHaveLength(100);
    expect(activities[0]?.actionKey).toBe('action-104');
    expect(activities.at(-1)?.actionKey).toBe('action-5');
  });

  it('replaces the same action state for the current day', () => {
    const { result } = renderHook(() => useCampaignActionStates());

    act(() => {
      result.current.setActionState('done', actionInput('action-1'));
    });
    act(() => {
      result.current.setActionState('snoozed', actionInput('action-1'));
    });

    expect(result.current.todayActivities).toHaveLength(1);
    expect(result.current.todayActivities[0]).toMatchObject({
      actionKey: 'action-1',
      state: 'snoozed',
      dateKey: '2026-05-11',
    });
    expect(readActivities().activities).toHaveLength(1);
  });
});
