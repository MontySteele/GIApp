import { useEffect, useMemo, useState } from 'react';
import type { Campaign } from '@/types';
import {
  calculateCampaignPlan,
  type CampaignPlan,
  type CampaignPlanContext,
} from '../domain/campaignPlan';

export function useCampaignPlans(
  campaigns: Campaign[],
  context: CampaignPlanContext | null,
  isContextLoading = false
) {
  const [plans, setPlans] = useState<Record<string, CampaignPlan>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const campaignSignature = useMemo(
    () => campaigns.map((campaign) => `${campaign.id}:${campaign.updatedAt}`).join('|'),
    [campaigns]
  );
  // Keep the campaign array stable until a campaign's identity/update stamp changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const campaignSnapshot = useMemo(() => campaigns, [campaignSignature]);

  useEffect(() => {
    if (isContextLoading || !context) {
      setIsCalculating(false);
      return;
    }

    if (campaignSnapshot.length === 0) {
      setPlans({});
      setIsCalculating(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const contextSnapshot = context;
    setIsCalculating(true);
    setError(null);

    async function calculatePlans() {
      try {
        const results = await Promise.all(
          campaignSnapshot.map(async (campaign) => {
            const plan = await calculateCampaignPlan(campaign, contextSnapshot);
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
  }, [campaignSignature, campaignSnapshot, context, isContextLoading]);

  return {
    plans,
    isLoading: isContextLoading || !context,
    isCalculating,
    error,
  };
}
