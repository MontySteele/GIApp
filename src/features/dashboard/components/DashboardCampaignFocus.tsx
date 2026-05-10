import { useCampaignPlanContext } from '@/features/campaigns/hooks/useCampaignPlanContext';
import { useCampaignPlans } from '@/features/campaigns/hooks/useCampaignPlans';
import { useCampaigns } from '@/features/campaigns/hooks/useCampaigns';
import { ActiveCampaignsWidgetView } from './ActiveCampaignsWidget';
import CampaignNextActionsWidget from './CampaignNextActionsWidget';

export default function DashboardCampaignFocus() {
  const { activeCampaigns, isLoading: campaignsLoading } = useCampaigns();
  const { context: campaignPlanContext, isLoading: campaignPlanContextLoading } = useCampaignPlanContext();
  const {
    plans,
    isLoading: plansLoading,
    isCalculating,
    error,
  } = useCampaignPlans(activeCampaigns, campaignPlanContext, campaignPlanContextLoading);

  const plansPending = plansLoading || isCalculating;

  return (
    <div className="space-y-4">
      <CampaignNextActionsWidget
        activeCampaigns={activeCampaigns}
        isLoading={campaignsLoading}
        plans={plans}
        plansPending={plansPending}
        error={error}
      />
      <ActiveCampaignsWidgetView
        activeCampaigns={activeCampaigns}
        isLoading={campaignsLoading}
        plans={plans}
        plansPending={plansPending}
      />
    </div>
  );
}
