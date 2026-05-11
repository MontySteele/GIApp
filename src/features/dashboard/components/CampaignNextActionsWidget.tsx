import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Hammer,
  Import,
  Package,
  Play,
  RefreshCw,
  Sparkles,
  Target,
  UserPlus,
  ListChecks,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useAccountDataFreshness } from '@/features/sync';
import { useCampaignActionStates, type CampaignActionState } from '@/features/campaigns/hooks/useCampaignActionStates';
import { formatCampaignDate } from '@/features/campaigns/lib/campaignOrdering';
import {
  buildCampaignDashboardActions,
  buildFreshnessDashboardAction,
  getActionActivityInput,
  getActionCampaignName,
  getActionCategory,
  getActionDetail,
  getActionKey,
  getActionLabel,
  getFocusedCampaign,
  getRankedDashboardActions,
  type DashboardAction,
} from '@/features/campaigns/domain/campaignDashboardActions';
import type {
  CampaignActionCategory,
  CampaignPlan,
} from '@/features/campaigns/domain/campaignPlan';
import type { DashboardResumeAction } from '../domain/dashboardResume';
import type { Campaign } from '@/types';

interface CampaignNextActionsWidgetProps {
  activeCampaigns: Campaign[];
  isLoading: boolean;
  plans: Record<string, CampaignPlan>;
  plansPending: boolean;
  resumeAction: DashboardResumeAction;
  error?: string | null;
}

const CATEGORY_BADGE: Record<CampaignActionCategory, 'primary' | 'warning' | 'success' | 'danger' | 'outline'> = {
  pulls: 'primary',
  materials: 'warning',
  build: 'success',
  roster: 'danger',
  done: 'outline',
};

const FRESHNESS_BADGE = 'warning' as const;

const RESUME_BADGE: Record<DashboardResumeAction['priority'], 'primary' | 'warning' | 'success' | 'outline'> = {
  target: 'primary',
  import: 'warning',
  manual: 'outline',
  start: 'success',
};

const RESUME_ICONS = {
  target: Target,
  import: Import,
  manual: ListChecks,
  start: Play,
} satisfies Record<DashboardResumeAction['priority'], typeof Target>;

function getCategoryIcon(category: CampaignActionCategory | 'freshness') {
  switch (category) {
    case 'pulls':
      return Sparkles;
    case 'materials':
      return Package;
    case 'build':
      return Hammer;
    case 'roster':
      return UserPlus;
    case 'done':
      return CheckCircle2;
    case 'freshness':
      return RefreshCw;
  }
}

export default function CampaignNextActionsWidget({
  activeCampaigns,
  isLoading,
  plans,
  plansPending,
  resumeAction,
  error,
}: CampaignNextActionsWidgetProps) {
  const dataFreshness = useAccountDataFreshness();
  const { todayActivities, getActionState, setActionState } = useCampaignActionStates();
  const campaignActions = buildCampaignDashboardActions(activeCampaigns, plans);
  const freshnessAction = buildFreshnessDashboardAction(activeCampaigns.length, dataFreshness);
  const allActions = getRankedDashboardActions(campaignActions, freshnessAction);
  const actions = allActions.filter((action) => !getActionState(getActionKey(action)));
  const handledActionCount = allActions.length - actions.length;
  const [focusAction, ...secondaryActions] = actions;
  const focusedCampaign = getFocusedCampaign(activeCampaigns, plans, focusAction);
  const focusedPlan = focusedCampaign ? plans[focusedCampaign.id] : undefined;
  const activeTargetLabel = `${activeCampaigns.length} active target${activeCampaigns.length === 1 ? '' : 's'}`;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="mb-3 h-5 w-36 animate-pulse rounded bg-slate-700" />
          <div className="h-20 animate-pulse rounded bg-slate-800" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card role="region" aria-label="Next up" className="border-primary-900/50 bg-primary-950/10">
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary-400" aria-hidden="true" />
          <h3 className="font-semibold">Next Up</h3>
        </div>
        <Link
          to="/campaigns"
          className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300"
        >
          Targets <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent>
        {error && activeCampaigns.length > 0 && !plansPending && actions.length === 0 ? (
          <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-3">
            <p className="text-sm font-medium text-red-100">Unable to calculate the next target action.</p>
            <p className="mt-1 text-xs text-red-200/80">{error}</p>
          </div>
        ) : activeCampaigns.length > 0 && plansPending && actions.length === 0 ? (
          <div className="space-y-3">
            <div className="h-5 w-44 animate-pulse rounded bg-slate-700" />
            <div
              aria-label="Campaign action loading"
              className="h-20 animate-pulse rounded-lg bg-slate-900"
            />
          </div>
        ) : focusAction ? (
          <div className="space-y-3">
            {focusedCampaign && (
              <Link
                to={`/campaigns/${focusedCampaign.id}`}
                className="flex flex-col gap-3 rounded-lg border border-primary-900/50 bg-slate-950/50 p-3 transition-colors hover:border-primary-700/70 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="min-w-0">
                  <span className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant="primary">Current focus</Badge>
                    {focusedPlan && (
                      <Badge variant={focusedPlan.status === 'ready' ? 'success' : focusedPlan.status === 'attention' ? 'warning' : 'danger'}>
                        {focusedPlan.overallPercent}% ready
                      </Badge>
                    )}
                  </span>
                  <span className="block truncate text-sm font-semibold text-slate-100">
                    {focusedCampaign.name}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    P{focusedCampaign.priority}
                    {focusedCampaign.deadline ? `, deadline ${formatCampaignDate(focusedCampaign.deadline)}` : ', no deadline'}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-300">
                  Open campaign
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </Link>
            )}
            <ActionCard
              item={focusAction}
              prominent
              onSetState={(state) => setActionState(state, getActionActivityInput(focusAction))}
            />
            {secondaryActions.slice(0, 3).map((item) => (
              <ActionCard key={getActionKey(item)} item={item} />
            ))}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3 text-xs text-slate-500">
              <span>
                {actions.length} next action{actions.length === 1 ? '' : 's'}
                {handledActionCount > 0 && `, ${handledActionCount} handled`}.
              </span>
              <span>{activeTargetLabel}</span>
              {actions.length > 4 && (
                <Link to="/campaigns" className="text-primary-400 hover:text-primary-300">
                  {actions.length - 4} more actions
                </Link>
              )}
            </div>
            {todayActivities.length > 0 && (
              <ActivityLog activities={todayActivities.slice(0, 3)} />
            )}
          </div>
        ) : activeCampaigns.length > 0 && allActions.length > 0 ? (
          <div className="rounded-lg bg-slate-900 p-3">
            <p className="text-sm font-medium text-slate-200">
              All target actions handled today.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Completed and snoozed actions return tomorrow.
            </p>
            {todayActivities.length > 0 && (
              <ActivityLog activities={todayActivities.slice(0, 3)} />
            )}
          </div>
        ) : (
          <ResumeActionPanel action={resumeAction} activeTargetCount={activeCampaigns.length} />
        )}
      </CardContent>
    </Card>
  );
}

function ResumeActionPanel({
  action,
  activeTargetCount,
}: {
  action: DashboardResumeAction;
  activeTargetCount: number;
}) {
  const Icon = RESUME_ICONS[action.priority];
  const badgeLabel =
    action.priority === 'import'
      ? 'setup'
      : action.priority === 'manual'
        ? 'setup'
        : action.priority === 'start'
          ? 'target'
          : 'resume';

  return (
    <div className="flex flex-col gap-4 rounded-lg bg-slate-900 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant={RESUME_BADGE[action.priority]}>{badgeLabel}</Badge>
          {activeTargetCount > 0 && (
            <span className="text-xs text-slate-500">
              {activeTargetCount} active target{activeTargetCount === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-400" aria-hidden="true" />
          <div className="min-w-0">
            <h4 className="text-base font-semibold text-slate-100">{action.title}</h4>
            <p className="mt-1 text-sm text-slate-400">{action.detail}</p>
          </div>
        </div>
      </div>
      <Link
        to={action.href}
        className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
      >
        {action.actionLabel}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

function getActionBadge(item: DashboardAction): 'primary' | 'warning' | 'success' | 'danger' | 'outline' {
  if (item.kind === 'freshness') return FRESHNESS_BADGE;
  return CATEGORY_BADGE[item.action.category];
}

function getStateLabel(state: CampaignActionState): string {
  if (state === 'done') return 'Done today';
  if (state === 'started') return 'Started';
  if (state === 'skipped') return 'Skipped';
  return 'Snoozed';
}

function getStateBadge(state: CampaignActionState): 'primary' | 'secondary' | 'success' | 'warning' {
  if (state === 'done') return 'success';
  if (state === 'started') return 'primary';
  if (state === 'skipped') return 'secondary';
  return 'warning';
}

function ActionCard({
  item,
  prominent = false,
  onSetState,
}: {
  item: DashboardAction;
  prominent?: boolean;
  onSetState?: (state: CampaignActionState) => void;
}) {
  const category = getActionCategory(item);
  const Icon = getCategoryIcon(category);
  const label = getActionLabel(item);
  const detail = getActionDetail(item);
  const badge = getActionBadge(item);
  const campaignName = getActionCampaignName(item);

  if (prominent) {
    return (
      <div className="flex flex-col gap-4 rounded-lg bg-slate-900 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant={badge}>{category === 'freshness' ? 'refresh' : category}</Badge>
            <span className="text-xs text-slate-500">{campaignName}</span>
            {item.kind === 'campaign' && (
              <span className="text-xs text-slate-600">{item.plan.overallPercent}% ready</span>
            )}
          </div>
          <div className="flex items-start gap-3">
            <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-400" aria-hidden="true" />
            <div className="min-w-0">
              <h4 className="text-base font-semibold text-slate-100">{label}</h4>
              <p className="mt-1 text-sm text-slate-400">{detail}</p>
              <p className="mt-2 text-xs text-slate-500">
                <span className="font-medium text-slate-400">Why this?</span> {item.why}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-col gap-2 sm:min-w-40">
          <Link
            to={item.destination.href}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            {item.destination.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          {onSetState && (
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="secondary" onClick={() => onSetState('done')}>
                Done
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onSetState('snoozed')}>
                Later
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Link
      to={item.destination.href}
      className="flex items-center justify-between gap-3 rounded-lg bg-slate-900/70 px-3 py-2 transition-colors hover:bg-slate-800"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Icon className="h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-slate-200">{label}</div>
          <div className="truncate text-xs text-slate-500">{campaignName} - {item.why}</div>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <Badge variant={badge}>{category === 'freshness' ? 'refresh' : category}</Badge>
        <ArrowRight className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
      </div>
    </Link>
  );
}

function ActivityLog({ activities }: { activities: Array<{ state: CampaignActionState; actionLabel: string }> }) {
  return (
    <div className="rounded-lg bg-slate-950/50 p-3">
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        Today&apos;s activity
      </div>
      <div className="space-y-1">
        {activities.map((activity, index) => (
          <div key={`${activity.actionLabel}-${index}`} className="flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-slate-400">{activity.actionLabel}</span>
            <Badge variant={getStateBadge(activity.state)}>
              {getStateLabel(activity.state)}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
