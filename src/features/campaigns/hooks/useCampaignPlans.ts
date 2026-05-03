import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCharacters } from '@/features/roster/hooks/useCharacters';
import { useMaterials } from '@/features/planner/hooks/useMaterials';
import { getAvailablePullsFromTracker } from '@/lib/services/resourceService';
import type { Campaign } from '@/types';
import { calculateCampaignPlan, type CampaignPlan } from '../domain/campaignPlan';

export function useCampaignPlans(campaigns: Campaign[]) {
  const { characters, isLoading: charactersLoading } = useCharacters();
  const { materials, isLoading: materialsLoading } = useMaterials();
  const availablePulls = useLiveQuery(() => getAvailablePullsFromTracker(), []);
  const [plans, setPlans] = useState<Record<string, CampaignPlan>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const campaignSignature = useMemo(
    () => campaigns.map((campaign) => `${campaign.id}:${campaign.updatedAt}`).join('|'),
    [campaigns]
  );

  useEffect(() => {
    if (charactersLoading || materialsLoading || availablePulls === undefined) {
      return;
    }

    let cancelled = false;
    const availablePullsSnapshot = availablePulls;
    setIsCalculating(true);
    setError(null);

    async function calculatePlans() {
      try {
        const results = await Promise.all(
          campaigns.map(async (campaign) => {
            const plan = await calculateCampaignPlan(campaign, {
              characters,
              materials,
              availablePulls: availablePullsSnapshot,
            });
            return [campaign.id, plan] as const;
          })
        );

        if (!cancelled) {
          setPlans(Object.fromEntries(results));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to calculate campaigns');
        }
      } finally {
        if (!cancelled) {
          setIsCalculating(false);
        }
      }
    }

    void calculatePlans();

    return () => {
      cancelled = true;
    };
  }, [
    availablePulls,
    campaignSignature,
    campaigns,
    characters,
    charactersLoading,
    materials,
    materialsLoading,
  ]);

  return {
    plans,
    isLoading: charactersLoading || materialsLoading || availablePulls === undefined,
    isCalculating,
    error,
  };
}
