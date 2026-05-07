import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCharacters } from '@/features/roster/hooks/useCharacters';
import { useMaterials } from '@/lib/hooks/useMaterials';
import { getAvailablePullsFromTracker } from '@/lib/services/resourceService';
import type { CampaignPlanContext } from '../domain/campaignPlan';

export function useCampaignPlanContext() {
  const { characters, isLoading: charactersLoading } = useCharacters();
  const { materials, isLoading: materialsLoading } = useMaterials();
  const availablePulls = useLiveQuery(() => getAvailablePullsFromTracker(), []);

  const isLoading = charactersLoading || materialsLoading || availablePulls === undefined;
  const context = useMemo<CampaignPlanContext | null>(
    () => (
      availablePulls === undefined
        ? null
        : {
            characters,
            materials,
            availablePulls,
          }
    ),
    [availablePulls, characters, materials]
  );

  return {
    context,
    characters,
    isLoading,
    charactersLoading,
    materialsLoading,
    availablePullsLoading: availablePulls === undefined,
  };
}
