import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { campaignRepo } from '../repo/campaignRepo';
import type { Campaign } from '@/types';

export function useCampaigns() {
  const campaigns = useLiveQuery(() => campaignRepo.getAll(), []);

  const activeCampaigns = useMemo(
    () => (campaigns ?? []).filter((campaign) => campaign.status === 'active'),
    [campaigns]
  );

  const createCampaign = async (
    campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>
  ) => campaignRepo.create(campaign);

  const updateCampaign = async (
    id: string,
    updates: Partial<Omit<Campaign, 'id' | 'createdAt'>>
  ) => campaignRepo.update(id, updates);

  const deleteCampaign = async (id: string) => campaignRepo.delete(id);

  return {
    campaigns: campaigns ?? [],
    activeCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    isLoading: campaigns === undefined,
  };
}

export function useCampaign(id: string | undefined) {
  const result = useLiveQuery(
    () => (id ? campaignRepo.getById(id).then((c) => c ?? null) : undefined),
    [id]
  );

  return {
    campaign: result ?? undefined,
    isLoading: result === undefined && id !== undefined,
    notFound: result === null,
  };
}
