import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  ArrowRight,
  Calculator,
  Calendar,
  CheckCircle2,
  CirclePause,
  CirclePlay,
  Package,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
  UsersRound,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import DeleteConfirmModal from '@/features/roster/components/DeleteConfirmModal';
import { getDisplayName } from '@/lib/gameData';
import type { Campaign, CampaignStatus } from '@/types';
import type { CampaignNextAction, CampaignPlan } from '../domain/campaignPlan';
import { getCampaignPullTargets } from '../domain/campaignPlan';
import {
  buildCampaignCalculatorHref,
  buildCampaignMaterialHref,
} from '../lib/campaignActionLinks';
import { formatCampaignDate } from '../lib/campaignOrdering';

interface CampaignCardProps {
  campaign: Campaign;
  plan: CampaignPlan | undefined;
  isPlanLoading: boolean;
  dataFreshnessStatus: 'fresh' | 'stale' | 'missing';
  onStatusChange: (campaign: Campaign, status: CampaignStatus) => Promise<void>;
  onRefresh: (campaign: Campaign) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const STATUS_BADGE: Record<CampaignStatus, 'success' | 'warning' | 'secondary' | 'outline'> = {
  active: 'success',
  paused: 'warning',
  completed: 'secondary',
  archived: 'outline',
};

const ACTION_BADGE: Record<CampaignNextAction['category'], 'primary' | 'secondary' | 'success' | 'warning' | 'outline'> = {
  pulls: 'primary',
  materials: 'warning',
  build: 'secondary',
  roster: 'outline',
  done: 'success',
};

const PLAN_STATUS_BADGE: Record<CampaignPlan['status'], 'success' | 'warning' | 'danger'> = {
  ready: 'success',
  attention: 'warning',
  blocked: 'danger',
};

export default function CampaignCard({
  campaign,
  plan,
  isPlanLoading,
  dataFreshnessStatus,
  onStatusChange,
  onRefresh,
  onDelete,
}: CampaignCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const Icon = campaign.type === 'team-polish'
    ? UsersRound
    : campaign.type === 'character-polish'
      ? Target
      : Sparkles;
  const targetCount = campaign.characterTargets.length;
  const pullTargets = getCampaignPullTargets(campaign);
  const pullCopyGoal = pullTargets.reduce((sum, target) => sum + target.desiredCopies, 0);
  const pullGoalLabel = pullTargets.length > 0
    ? `${pullCopyGoal} ${pullCopyGoal === 1 ? 'copy' : 'copies'}`
    : 'None';
  const dataFreshnessLabel =
    dataFreshnessStatus === 'fresh'
      ? 'Current'
      : dataFreshnessStatus === 'stale'
        ? 'Stale'
        : 'Import';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-primary-500/20">
              <Icon className="w-5 h-5 text-primary-400" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-100 truncate">{campaign.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant={STATUS_BADGE[campaign.status]}>{campaign.status}</Badge>
                {plan && <Badge variant={PLAN_STATUS_BADGE[plan.status]}>{plan.overallPercent}% ready</Badge>}
                <Badge variant="outline">P{campaign.priority}</Badge>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatCampaignDate(campaign.deadline)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-500 mb-1">Targets</div>
            <div className="text-lg font-semibold text-slate-100">{targetCount}</div>
          </div>
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-500 mb-1">Pull Goal</div>
            <div className="text-lg font-semibold text-slate-100">{pullGoalLabel}</div>
          </div>
        </div>

        {isPlanLoading && (
          <div className="grid grid-cols-3 gap-3">
            <div className="h-16 bg-slate-900 rounded-lg animate-pulse" />
            <div className="h-16 bg-slate-900 rounded-lg animate-pulse" />
            <div className="h-16 bg-slate-900 rounded-lg animate-pulse" />
          </div>
        )}

        {plan && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <PlanStat
              label="Pulls"
              value={`${plan.pullReadiness.percent}%`}
              detail={
                plan.pullReadiness.hasTargets
                  ? `${plan.pullReadiness.availablePulls}/${plan.pullReadiness.targetPulls}`
                  : 'No pull target'
              }
            />
            <PlanStat
              label="Build"
              value={`${plan.buildReadiness.percent}%`}
              detail={`${plan.buildReadiness.readyCount ?? 0}/${plan.buildReadiness.targetCount} built`}
            />
            <PlanStat
              label="Materials"
              value={`${plan.materialReadiness.percent}%`}
              detail={
                plan.materialReadiness.hasTargets
                  ? `${plan.materialReadiness.deficitMaterials} deficits`
                  : 'No materials'
              }
            />
            <PlanStat
              label="Data"
              value={dataFreshnessLabel}
              detail={dataFreshnessStatus === 'fresh' ? 'Fresh import' : 'Refresh recommended'}
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {campaign.characterTargets.map((target) => (
            <Badge key={target.id} variant={target.ownership === 'owned' ? 'secondary' : 'primary'}>
              {getDisplayName(target.characterKey)} - {target.buildGoal}
            </Badge>
          ))}
        </div>

        {campaign.notes && (
          <p className="text-sm text-slate-400 bg-slate-900/60 rounded-lg p-3">{campaign.notes}</p>
        )}

        {plan && (
          <div className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Next Actions</div>
            <div className="space-y-2">
              {plan.nextActions.slice(0, 3).map((action) => (
                <div
                  key={action.id}
                  className="flex items-start justify-between gap-3 rounded-lg bg-slate-900/70 p-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-200">{action.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{action.detail}</div>
                  </div>
                  <Badge variant={ACTION_BADGE[action.category]}>{action.category}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            to={`/campaigns/${campaign.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-600"
          >
            <ArrowRight className="w-4 h-4" />
            Open
          </Link>
          {plan?.materialReadiness.hasTargets && (
            <Link
              to={buildCampaignMaterialHref(campaign.id)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-600"
            >
              <Package className="w-4 h-4" />
              Materials
            </Link>
          )}
          {plan?.pullReadiness.hasTargets && (
            <Link
              to={buildCampaignCalculatorHref(campaign, plan)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-600"
            >
              <Calculator className="w-4 h-4" />
              Calculator
            </Link>
          )}
          <Button size="sm" variant="secondary" onClick={() => onRefresh(campaign)}>
            <RefreshCw className="w-4 h-4" />
            Refresh Plan
          </Button>
          {campaign.status === 'active' ? (
            <Button size="sm" variant="secondary" onClick={() => onStatusChange(campaign, 'paused')}>
              <CirclePause className="w-4 h-4" />
              Pause
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => onStatusChange(campaign, 'active')}>
              <CirclePlay className="w-4 h-4" />
              Activate
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => onStatusChange(campaign, 'completed')}>
            <CheckCircle2 className="w-4 h-4" />
            Complete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onStatusChange(campaign, 'archived')}>
            <Archive className="w-4 h-4" />
            Archive
          </Button>
          <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>

        <DeleteConfirmModal
          isOpen={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            onDelete(campaign.id);
          }}
          title="Delete Target"
          itemName={campaign.name}
          description="This will permanently delete the target, including all planning data. This action cannot be undone."
        />
      </CardContent>
    </Card>
  );
}

function PlanStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="bg-slate-900 rounded-lg p-3">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-lg font-semibold text-slate-100">{value}</div>
      <div className="text-xs text-slate-500 truncate">{detail}</div>
    </div>
  );
}
