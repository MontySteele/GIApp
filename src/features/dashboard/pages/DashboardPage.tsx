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
  RefreshCw,
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
import TargetSummaryList from '@/features/targets/components/TargetSummaryList';
import { buildTargetSummaries } from '@/features/targets/domain/targetSummary';
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.85fr)]">
        <div className="space-y-4">
          <DashboardCampaignFocus resumeAction={resumeAction} />
          {hasExistingTargets ? (
            <TargetEntryCard
              activeTargetCount={activeTargetCount}
              freshness={accountFreshness}
            />
          ) : (
            <TargetQuickStart />
          )}
        </div>
        <CaptureSnapshotPanel
          charStats={charStats}
          artifactStats={artifactStats}
          weaponStats={weaponStats}
          eventPulls={eventPulls}
          pullSubtext={pullSubtext}
          primogems={primogems}
          intertwined={intertwined}
          starglitterPulls={starglitterPulls}
          currentResin={currentResin}
          maxResin={resinBudget.maxResin}
          minutesToFull={minutesToFull}
          fragileResin={resinBudget.fragileResin}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <TargetSummaryList targets={targetSummaries} />
        <TodayFarmingWidget />
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

interface TargetEntryCardProps {
  activeTargetCount: number;
  freshness: ReturnType<typeof useAccountDataFreshness>;
}

function TargetEntryCard({ activeTargetCount, freshness }: TargetEntryCardProps) {
  const needsImport = freshness.status !== 'fresh';
  const title = needsImport ? 'Refresh before adding targets' : 'Start another target';
  const detail = needsImport
    ? freshness.detail || 'Update account data before creating another target.'
    : activeTargetCount > 0
      ? `${activeTargetCount} active target${activeTargetCount === 1 ? '' : 's'} already in motion.`
      : 'Review existing target ideas or start a new one from Targets.';
  const href = needsImport ? '/imports' : '/campaigns';
  const actionLabel = needsImport ? 'Open Import Hub' : 'New Target';
  const Icon = needsImport ? RefreshCw : Target;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary-400" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-slate-100">Start Target</h2>
          </div>
          <p className="text-sm font-medium text-slate-200">{title}</p>
          <p className="mt-1 text-sm text-slate-400">{detail}</p>
        </div>
        <div className="flex flex-shrink-0 flex-wrap gap-2">
          <Link
            to={href}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              needsImport
                ? 'bg-amber-600 text-white hover:bg-amber-500'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {actionLabel}
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
  primogems: number;
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
  primogems,
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

        <div className="grid grid-cols-2 gap-2">
          <SnapshotTile
            icon={<Users className="h-4 w-4" aria-hidden="true" />}
            label="Characters"
            value={charStats.total}
            subtext={`${charStats.maxLevel} at Lv.90`}
            color="text-blue-400"
            to="/roster"
          />
          <SnapshotTile
            icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
            label="Event Pulls"
            value={eventPulls}
            subtext={pullSubtext}
            color="text-green-400"
            to="/pulls"
          />
          <SnapshotTile
            icon={<Gem className="h-4 w-4" aria-hidden="true" />}
            label="Artifacts"
            value={artifactStats.total}
            subtext={`${artifactStats.fiveStar} 5-star`}
            color="text-purple-400"
            to="/roster/artifacts"
          />
          <SnapshotTile
            icon={<Sword className="h-4 w-4" aria-hidden="true" />}
            label="Weapons"
            value={weaponStats.total}
            subtext={`${weaponStats.fiveStars} 5-star`}
            color="text-yellow-400"
            to="/roster/weapons"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link to="/planner" className="rounded-lg bg-slate-950/70 p-3 transition-colors hover:bg-slate-800">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <Zap className="h-4 w-4 text-blue-400" aria-hidden="true" />
                Resin
              </span>
              <span className="text-xs text-primary-400">Planner</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-400">{currentResin}</div>
                <div className="text-xs text-slate-500">/ {maxResin}</div>
              </div>
              {currentResin >= maxResin ? (
                <Badge variant="warning">Full!</Badge>
              ) : (
                <div className="text-right text-xs text-slate-400">
                  Full in
                  <div className="text-sm font-medium text-slate-200">{formatTime(minutesToFull)}</div>
                </div>
              )}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${(currentResin / maxResin) * 100}%` }}
              />
            </div>
            {fragileResin > 0 && (
              <div className="mt-2 text-xs text-slate-500">+{fragileResin} Fragile Resin available</div>
            )}
          </Link>

          <Link to="/pulls" className="rounded-lg bg-slate-950/70 p-3 transition-colors hover:bg-slate-800">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <Sparkles className="h-4 w-4 text-yellow-400" aria-hidden="true" />
                Primogems
              </span>
              <span className="text-xs text-primary-400">Budget</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-400">{formatPrimos(primogems)}</div>
                <div className="text-xs text-slate-500">
                  + {intertwined} Intertwined
                  {starglitterPulls > 0 && `, ${starglitterPulls} via Starglitter`}
                </div>
              </div>
              <div className="text-right text-xs text-slate-400">
                Event Pulls
                <div className="text-sm font-medium text-slate-200">{eventPulls}</div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

interface SnapshotTileProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtext: string;
  color: string;
  to: string;
}

function SnapshotTile({ icon, label, value, subtext, color, to }: SnapshotTileProps) {
  return (
    <Link to={to}>
      <div className="rounded-lg bg-slate-950/70 p-3 transition-colors hover:bg-slate-800">
        <div className={`${color} mb-2`}>{icon}</div>
        <div className="text-xl font-bold text-slate-100">{value}</div>
        <div className="text-xs text-slate-400">{label}</div>
        <div className="mt-1 truncate text-xs text-slate-500">{subtext}</div>
      </div>
    </Link>
  );
}
