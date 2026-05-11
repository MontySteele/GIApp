import { useCampaignPlanContext } from '@/features/campaigns/hooks/useCampaignPlanContext';
import { useCampaignPlans } from '@/features/campaigns/hooks/useCampaignPlans';
import { useCampaigns } from '@/features/campaigns/hooks/useCampaigns';
import CampaignNextActionsWidget from './CampaignNextActionsWidget';
import type { DashboardResumeAction } from '../domain/dashboardResume';

export default function DashboardCampaignFocus({ resumeAction }: { resumeAction: DashboardResumeAction }) {
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
    <CampaignNextActionsWidget
      activeCampaigns={activeCampaigns}
      isLoading={campaignsLoading}
      plans={plans}
      plansPending={plansPending}
      resumeAction={resumeAction}
      error={error}
    />
  );
}
