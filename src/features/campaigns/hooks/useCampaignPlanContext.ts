import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { buildTemplateRepo } from '@/features/builds/repo/buildTemplateRepo';
import { useCharacters } from '@/features/roster/hooks/useCharacters';
import { useTeams } from '@/features/roster/hooks/useTeams';
import { useMaterials } from '@/lib/hooks/useMaterials';
import { getAvailablePullsFromTracker } from '@/lib/services/resourceService';
import type { CampaignPlanContext } from '../domain/campaignPlan';

export function useCampaignPlanContext() {
  const { characters, isLoading: charactersLoading } = useCharacters();
  const { teams, isLoading: teamsLoading } = useTeams();
  const { materials, isLoading: materialsLoading } = useMaterials();
  const availablePulls = useLiveQuery(() => getAvailablePullsFromTracker(), []);
  const buildTemplates = useLiveQuery(() => buildTemplateRepo.getAll(), []);

  const buildTemplatesLoading = buildTemplates === undefined;
  const isLoading = charactersLoading ||
    teamsLoading ||
    materialsLoading ||
    availablePulls === undefined ||
    buildTemplatesLoading;
  const context = useMemo<CampaignPlanContext | null>(
    () => (
      availablePulls === undefined || buildTemplates === undefined
        ? null
        : {
            characters,
            materials,
            availablePulls,
            teams,
            buildTemplates,
          }
    ),
    [availablePulls, buildTemplates, characters, materials, teams]
  );

  return {
    context,
    characters,
    isLoading,
    charactersLoading,
    teamsLoading,
    materialsLoading,
    availablePullsLoading: availablePulls === undefined,
    buildTemplatesLoading,
  };
}
