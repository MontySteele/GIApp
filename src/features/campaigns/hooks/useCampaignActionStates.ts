import { useCallback, useMemo, useState } from 'react';

export type CampaignActionState = 'done' | 'skipped' | 'snoozed';

export interface CampaignActionActivity {
  id: string;
  actionKey: string;
  campaignId: string | null;
  actionId: string;
  actionLabel: string;
  state: CampaignActionState;
  dateKey: string;
  createdAt: string;
}

interface StoredCampaignActionState {
  activities: CampaignActionActivity[];
}

const STORAGE_KEY = 'campaignActionStates:v1';

function getTodayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function readStoredState(): StoredCampaignActionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { activities: [] };
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'activities' in parsed &&
      Array.isArray(parsed.activities)
    ) {
      return { activities: parsed.activities as CampaignActionActivity[] };
    }
  } catch {
    // Ignore malformed local state and start fresh.
  }

  return { activities: [] };
}

function writeStoredState(state: StoredCampaignActionState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Local action state is helpful, but the app should keep working if storage is unavailable.
  }
}

export function useCampaignActionStates() {
  const [storedState, setStoredState] = useState(readStoredState);
  const todayKey = getTodayKey();

  const todayActivities = useMemo(
    () =>
      storedState.activities
        .filter((activity) => activity.dateKey === todayKey)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [storedState.activities, todayKey]
  );

  const getActionState = useCallback(
    (actionKey: string): CampaignActionActivity | undefined =>
      todayActivities.find((activity) => activity.actionKey === actionKey),
    [todayActivities]
  );

  const setActionState = useCallback(
    (
      state: CampaignActionState,
      action: {
        actionKey: string;
        campaignId: string | null;
        actionId: string;
        actionLabel: string;
      }
    ) => {
      setStoredState((current) => {
        const nextActivity: CampaignActionActivity = {
          id: crypto.randomUUID(),
          actionKey: action.actionKey,
          campaignId: action.campaignId,
          actionId: action.actionId,
          actionLabel: action.actionLabel,
          state,
          dateKey: todayKey,
          createdAt: new Date().toISOString(),
        };
        const nextState = {
          activities: [
            nextActivity,
            ...current.activities.filter(
              (activity) => !(activity.dateKey === todayKey && activity.actionKey === action.actionKey)
            ),
          ].slice(0, 100),
        };
        writeStoredState(nextState);
        return nextState;
      });
    },
    [todayKey]
  );

  return {
    todayActivities,
    getActionState,
    setActionState,
  };
}
