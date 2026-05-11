import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Users,
  Gem,
  Sword,
  Sparkles,
  Zap,
  ArrowRight,
  LayoutDashboard,
  Target,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { StatCardSkeleton, CardSkeleton } from '@/components/ui/Skeleton';
import { db } from '@/db/schema';
import GettingStartedChecklist from '@/components/common/GettingStartedChecklist';
import { useCharacters } from '@/features/roster/hooks/useCharacters';
import { useArtifacts } from '@/features/artifacts/hooks/useArtifacts';
import { useWeapons } from '@/features/weapons/hooks/useWeapons';
import { useTeams } from '@/features/roster/hooks/useTeams';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { getAvailablePullsFromTracker } from '@/lib/services/resourceService';
import { useCampaigns } from '@/features/campaigns/hooks/useCampaigns';
import { upcomingWishRepo } from '@/features/wishes/repo/upcomingWishRepo';
import QuickResourceLogger from '@/features/ledger/components/QuickResourceLogger';
import TargetQuickStart from '@/features/targets/components/TargetQuickStart';
import { buildTargetSummaries, type TargetSummary } from '@/features/targets/domain/targetSummary';
import { useAccountDataFreshness } from '@/features/sync/hooks/useAccountDataFreshness';
import { useWishlistStore } from '@/stores/wishlistStore';
import DashboardCampaignFocus from '../components/DashboardCampaignFocus';
import TodayFarmingWidget from '../components/TodayFarmingWidget';
import { buildDashboardResumeAction } from '../domain/dashboardResume';
import {
  calculateCurrentResin,
  timeUntilFull,
  formatTime,
  DEFAULT_RESIN_BUDGET,
  type ResinBudget,
} from '@/features/planner/domain/resinCalculator';

/**
 * Format primogems to readable string
 */
function formatPrimos(primos: number): string {
  if (primos >= 1000000) {
    return `${(primos / 1000000).toFixed(1)}M`;
  }
  if (primos >= 1000) {
    return `${(primos / 1000).toFixed(1)}K`;
  }
  return primos.toLocaleString();
}

export default function DashboardPage() {
  const { characters, isLoading: loadingChars } = useCharacters();
  const { stats: artifactStats, isLoading: loadingArtifacts } = useArtifacts();
  const { stats: weaponStats, isLoading: loadingWeapons } = useWeapons();
  const availablePulls = useLiveQuery(() => getAvailablePullsFromTracker(), []);
  const wishHistoryCount = useLiveQuery(() => db.wishRecords.count(), []);
  const plannedBannersResult = useLiveQuery(() => upcomingWishRepo.getAll(), []);
  const loadingResources = availablePulls === undefined;
  const { teams } = useTeams();
  const { campaigns, isLoading: loadingCampaigns } = useCampaigns();
  const accountFreshness = useAccountDataFreshness();
  const {
    checklist,
    checklistProgress,
    checklistTotal,
    updateChecklist,
    isComplete: hasCompletedOnboardingWizard,
  } = useOnboardingContext();
  const wishlistCharacters = useWishlistStore((state) => state.characters);

  // Persist checklist dismiss state in localStorage
  const [showChecklist, setShowChecklist] = useState(() => {
    const dismissed = localStorage.getItem('checklist_dismissed');
    return dismissed !== 'true';
  });

  const handleDismissChecklist = () => {
    localStorage.setItem('checklist_dismissed', 'true');
    setShowChecklist(false);
  };

  // Load resin from localStorage
  const resinBudget = useMemo<ResinBudget>(() => {
    try {
      const saved = localStorage.getItem('resinBudget');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_RESIN_BUDGET;
  }, []);

  const currentResin = calculateCurrentResin(resinBudget);
  const minutesToFull = timeUntilFull(currentResin, resinBudget.maxResin);

  // Character stats
  const charStats = useMemo(() => {
    const total = characters.length;
    const maxLevel = characters.filter((c) => c.level === 90).length;
    const maxConst = characters.filter((c) => c.constellation === 6).length;
    return { total, maxLevel, maxConst };
  }, [characters]);

  // Update checklist based on current data
  useEffect(() => {
    if (characters.length > 0 && !checklist.hasImportedCharacters) {
      updateChecklist({ hasImportedCharacters: true });
    }
    if (teams.length > 0 && !checklist.hasCreatedTeam) {
      updateChecklist({ hasCreatedTeam: true });
    }
    if (
      typeof wishHistoryCount === 'number' &&
      wishHistoryCount > 0 &&
      !checklist.hasImportedWishHistory
    ) {
      updateChecklist({ hasImportedWishHistory: true });
    }
  }, [characters.length, teams.length, wishHistoryCount, checklist, updateChecklist]);

  const isLoading = loadingChars || loadingArtifacts || loadingWeapons || loadingResources || loadingCampaigns;
  const primogems = availablePulls?.resources.primogems ?? 0;
  const genesisCrystals = availablePulls?.resources.genesisCrystals ?? 0;
  const intertwined = availablePulls?.resources.intertwined ?? 0;
  const eventPulls = availablePulls?.availablePulls ?? 0;
  const starglitterPulls = availablePulls?.pullAvailability?.starglitterPulls ?? 0;
  const pullSubtext = genesisCrystals > 0
    ? `${formatPrimos(primogems)} primos + ${formatPrimos(genesisCrystals)} crystals`
    : `${formatPrimos(primogems)} primogems`;
  const plannedBanners = useMemo(
    () => (Array.isArray(plannedBannersResult) ? plannedBannersResult : []),
    [plannedBannersResult]
  );
  const targetSummaries = useMemo(() => {
    return buildTargetSummaries({
      campaigns,
      plannedBanners,
      wishlist: wishlistCharacters,
      characters,
    });
  }, [campaigns, characters, plannedBanners, wishlistCharacters]);
  const hasExistingTargets = campaigns.length > 0 || plannedBanners.length > 0 || wishlistCharacters.length > 0;
  const activeTargetCount = campaigns.filter((campaign) => campaign.status === 'active').length;
  const needsAccountRefresh = accountFreshness.status !== 'fresh';
  const resumeAction = useMemo(
    () => buildDashboardResumeAction({
      targets: targetSummaries,
      accountFreshness,
      characterCount: charStats.total,
      wishHistoryCount: typeof wishHistoryCount === 'number' ? wishHistoryCount : 0,
    }),
    [accountFreshness, charStats.total, targetSummaries, wishHistoryCount]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-9 w-36 bg-slate-700 rounded animate-pulse mb-2" />
          <div className="h-5 w-64 bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton className="h-40" />
          <CardSkeleton className="h-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-slate-400">What to do now, plus the fastest capture points.</p>
        </div>
        <FreshnessHeaderLink freshness={accountFreshness} />
      </div>

      {hasCompletedOnboardingWizard && showChecklist && checklistProgress < checklistTotal && (
        <GettingStartedChecklist
          checklist={checklist}
          progress={checklistProgress}
          total={checklistTotal}
          onDismiss={handleDismissChecklist}
        />
      )}

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.8fr)]">
        <div className="min-w-0 space-y-4">
          <DashboardCampaignFocus resumeAction={resumeAction} />
          {!needsAccountRefresh && !hasExistingTargets && <TargetQuickStart />}
          <TodayFarmingWidget suppressFreshnessCallout={needsAccountRefresh} />
          {!needsAccountRefresh && hasExistingTargets && (
            <TargetEntryCard activeTargetCount={activeTargetCount} />
          )}
        </div>
        <div className="min-w-0 space-y-4">
          <CaptureSnapshotPanel
            charStats={charStats}
            artifactStats={artifactStats}
            weaponStats={weaponStats}
            eventPulls={eventPulls}
            pullSubtext={pullSubtext}
            intertwined={intertwined}
            starglitterPulls={starglitterPulls}
            currentResin={currentResin}
            maxResin={resinBudget.maxResin}
            minutesToFull={minutesToFull}
            fragileResin={resinBudget.fragileResin}
          />
          <TargetOverviewCard targets={targetSummaries} activeTargetCount={activeTargetCount} />
        </div>
      </div>
    </div>
  );
}

function FreshnessHeaderLink({
  freshness,
}: {
  freshness: ReturnType<typeof useAccountDataFreshness>;
}) {
  if (freshness.status !== 'fresh') return null;

  return (
    <Link
      to="/imports"
      aria-label={`Account data current: ${freshness.detail || 'Open Import Hub'}`}
      className="inline-flex max-w-full items-center gap-2 text-xs text-slate-500 transition-colors hover:text-slate-300"
    >
      <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
      <span className="truncate">{freshness.detail || 'Account data current'}</span>
    </Link>
  );
}

interface TargetOverviewCardProps {
  targets: TargetSummary[];
  activeTargetCount: number;
}

function TargetOverviewCard({ targets, activeTargetCount }: TargetOverviewCardProps) {
  const plannedCount = targets.filter((target) => target.status === 'planned' || target.status === 'wishlist').length;
  const pausedCount = targets.filter((target) => target.status === 'paused').length;
  const topTarget = targets.find((target) => target.status === 'active') ?? targets[0];
  const secondaryLabel = pausedCount > 0
    ? `${pausedCount} paused`
    : `${plannedCount} planned`;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary-400" aria-hidden="true" />
          <h2 className="font-semibold text-slate-100">Targets</h2>
        </div>
        <Link to="/campaigns" className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300">
          Manage <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>

      {targets.length === 0 ? (
        <div className="rounded-lg bg-slate-950/60 p-3">
          <p className="text-sm font-medium text-slate-200">No targets yet</p>
          <p className="mt-1 text-xs text-slate-500">Create one from the setup above when account data is ready.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <TargetMetric label="Active" value={activeTargetCount} />
            <TargetMetric label={pausedCount > 0 ? 'Paused' : 'Planned'} value={pausedCount || plannedCount} />
            <TargetMetric label="Total" value={targets.length} />
          </div>

          {topTarget && (
            <Link
              to={topTarget.actionHref}
              className="flex items-center justify-between gap-3 rounded-lg bg-slate-950/60 px-3 py-2 transition-colors hover:bg-slate-800"
            >
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge variant={topTarget.status === 'active' ? 'primary' : 'outline'} className="text-xs">
                    {topTarget.status}
                  </Badge>
                  <span className="text-xs text-slate-500">{secondaryLabel}</span>
                </div>
                <p className="truncate text-sm font-medium text-slate-100">{topTarget.title}</p>
                <p className="truncate text-xs text-slate-500">{topTarget.subtitle}</p>
              </div>
              <span className="flex flex-shrink-0 items-center gap-1 text-xs font-medium text-primary-300">
                {topTarget.actionLabel}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

function TargetMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-950/60 px-3 py-2">
      <div className="text-lg font-semibold text-slate-100">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

interface TargetEntryCardProps {
  activeTargetCount: number;
}

function TargetEntryCard({ activeTargetCount }: TargetEntryCardProps) {
  const detail = activeTargetCount > 0
    ? `${activeTargetCount} active target${activeTargetCount === 1 ? '' : 's'} already in motion.`
    : 'Review existing target ideas or start a new one from Targets.';

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary-400" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-slate-100">Start Target</h2>
          </div>
          <p className="text-sm font-medium text-slate-200">Start another target</p>
          <p className="mt-1 text-sm text-slate-400">{detail}</p>
        </div>
        <div className="flex flex-shrink-0 flex-wrap gap-2">
          <Link
            to="/campaigns"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            <Target className="h-4 w-4" aria-hidden="true" />
            New Target
          </Link>
          <Link
            to="/campaigns"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700"
          >
            Manage
          </Link>
        </div>
      </div>
    </section>
  );
}

interface CaptureSnapshotPanelProps {
  charStats: { total: number; maxLevel: number; maxConst: number };
  artifactStats: { total: number; fiveStar: number };
  weaponStats: { total: number; fiveStars: number };
  eventPulls: number;
  pullSubtext: string;
  intertwined: number;
  starglitterPulls: number;
  currentResin: number;
  maxResin: number;
  minutesToFull: number;
  fragileResin: number;
}

function CaptureSnapshotPanel({
  charStats,
  artifactStats,
  weaponStats,
  eventPulls,
  pullSubtext,
  intertwined,
  starglitterPulls,
  currentResin,
  maxResin,
  minutesToFull,
  fragileResin,
}: CaptureSnapshotPanelProps) {
  return (
    <section id="quick-resource-logger" className="scroll-mt-20 rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-primary-400" aria-hidden="true" />
          <h2 className="font-semibold">Capture + Snapshot</h2>
        </div>
        <Link to="/pulls" className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300">
          Pulls <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>

      <div className="space-y-4">
        <QuickResourceLogger variant="embedded" />

        <div className="space-y-2">
          <SnapshotRow
            to="/pulls"
            icon={<Sparkles className="h-4 w-4 text-yellow-400" aria-hidden="true" />}
            label="Pulls"
            value={`${eventPulls} event pulls`}
            detail={`${pullSubtext}, ${intertwined} Intertwined${starglitterPulls > 0 ? `, ${starglitterPulls} via Starglitter` : ''}`}
            actionLabel="Pulls"
          />
          <SnapshotRow
            to="/roster/planner"
            icon={<Zap className="h-4 w-4 text-blue-400" aria-hidden="true" />}
            label="Resin"
            value={`${currentResin} / ${maxResin}`}
            detail={currentResin >= maxResin ? 'Full' : `Full in ${formatTime(minutesToFull)}`}
            badge={currentResin >= maxResin ? 'Full!' : undefined}
            actionLabel="Roster"
          />
          {fragileResin > 0 && (
            <p className="px-1 text-xs text-slate-500">+{fragileResin} Fragile Resin available</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <SnapshotPill
            to="/roster"
            icon={<Users className="h-4 w-4 text-blue-400" aria-hidden="true" />}
            label="Characters"
            value={charStats.total}
            subtext={`${charStats.maxLevel} at Lv.90`}
          />
          <SnapshotPill
            to="/roster/artifacts"
            icon={<Gem className="h-4 w-4 text-purple-400" aria-hidden="true" />}
            label="Artifacts"
            value={artifactStats.total}
            subtext={`${artifactStats.fiveStar} 5-star`}
          />
          <SnapshotPill
            to="/roster/weapons"
            icon={<Sword className="h-4 w-4 text-yellow-400" aria-hidden="true" />}
            label="Weapons"
            value={weaponStats.total}
            subtext={`${weaponStats.fiveStars} 5-star`}
          />
        </div>
      </div>
    </section>
  );
}

interface SnapshotRowProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  actionLabel: string;
  badge?: string;
}

function SnapshotRow({ to, icon, label, value, detail, actionLabel, badge }: SnapshotRowProps) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-3 rounded-lg bg-slate-950/70 px-3 py-2 transition-colors hover:bg-slate-800"
    >
      <div className="flex min-w-0 items-center gap-3">
        {icon}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-200">{label}</span>
            {badge && <Badge variant="warning">{badge}</Badge>}
          </div>
          <p className="truncate text-xs text-slate-500">{detail}</p>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2 text-right">
        <span>
          <span className="block text-sm font-semibold text-slate-100">{value}</span>
          <span className="text-xs text-primary-400">{actionLabel}</span>
        </span>
        <ArrowRight className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
      </div>
    </Link>
  );
}

interface SnapshotPillProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  value: number;
  subtext: string;
}

function SnapshotPill({ to, icon, label, value, subtext }: SnapshotPillProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg bg-slate-950/70 px-3 py-2 transition-colors hover:bg-slate-800"
    >
      {icon}
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-100">{value} {label}</div>
        <div className="truncate text-xs text-slate-500">{subtext}</div>
      </div>
    </Link>
  );
}
