import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Gem,
  Sword,
  Sparkles,
  Zap,
  TrendingUp,
  Calendar,
  ArrowRight,
  Target,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { StatCardSkeleton, CardSkeleton } from '@/components/ui/Skeleton';
import { useCharacters } from '@/features/roster/hooks/useCharacters';
import { useArtifacts } from '@/features/artifacts/hooks/useArtifacts';
import { useWeapons } from '@/features/weapons/hooks/useWeapons';
import { useResources } from '@/features/ledger/hooks/useResources';
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
  const { primogems, intertwined, totalPulls, isLoading: loadingResources } = useResources();

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

  const isLoading = loadingChars || loadingArtifacts || loadingWeapons || loadingResources;

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
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
        <p className="text-slate-400">Your Genshin Impact account at a glance</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Characters"
          value={charStats.total}
          subtext={`${charStats.maxLevel} at Lv.90`}
          color="text-blue-400"
          to="/roster"
        />
        <StatCard
          icon={<Gem className="w-5 h-5" />}
          label="Artifacts"
          value={artifactStats.total}
          subtext={`${artifactStats.fiveStar} 5-star`}
          color="text-purple-400"
          to="/artifacts"
        />
        <StatCard
          icon={<Sword className="w-5 h-5" />}
          label="Weapons"
          value={weaponStats.total}
          subtext={`${weaponStats.fiveStars} 5-star`}
          color="text-yellow-400"
          to="/weapons"
        />
        <StatCard
          icon={<Sparkles className="w-5 h-5" />}
          label="Available Pulls"
          value={totalPulls}
          subtext={`${formatPrimos(primogems)} primogems`}
          color="text-green-400"
          to="/ledger"
        />
      </div>

      {/* Resources Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Resin Status */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold">Resin</h3>
            </div>
            <Link
              to="/planner"
              className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
            >
              Planner <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-400">{currentResin}</div>
                <div className="text-sm text-slate-400">/ {resinBudget.maxResin}</div>
              </div>
              <div className="text-right">
                {currentResin >= resinBudget.maxResin ? (
                  <Badge variant="warning">Full!</Badge>
                ) : (
                  <>
                    <div className="text-sm text-slate-400">Full in</div>
                    <div className="text-lg font-medium text-slate-200">
                      {formatTime(minutesToFull)}
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                style={{ width: `${(currentResin / resinBudget.maxResin) * 100}%` }}
              />
            </div>
            {resinBudget.fragileResin > 0 && (
              <div className="mt-2 text-xs text-slate-500">
                +{resinBudget.fragileResin} Fragile Resin available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Primogem Status */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <h3 className="font-semibold">Primogems</h3>
            </div>
            <Link
              to="/ledger"
              className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
            >
              Ledger <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-yellow-400">{formatPrimos(primogems)}</div>
                <div className="text-sm text-slate-400">+ {intertwined} Fates</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400">Available Pulls</div>
                <div className="text-lg font-medium text-slate-200">
                  {totalPulls}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickLink
          to="/roster"
          icon={<Users className="w-5 h-5" />}
          label="Manage Roster"
        />
        <QuickLink
          to="/planner"
          icon={<Target className="w-5 h-5" />}
          label="Ascension Planner"
        />
        <QuickLink
          to="/wishes"
          icon={<Sparkles className="w-5 h-5" />}
          label="Wish History"
        />
        <QuickLink
          to="/calendar"
          icon={<Calendar className="w-5 h-5" />}
          label="Reset Timers"
        />
      </div>

      {/* Empty State */}
      {charStats.total === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-200 mb-2">Get Started</h3>
            <p className="text-slate-400 mb-4">
              Import your character data to see your account overview
            </p>
            <Link
              to="/settings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 rounded text-white"
            >
              Go to Settings <ArrowRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtext: string;
  color: string;
  to: string;
}

function StatCard({ icon, label, value, subtext, color, to }: StatCardProps) {
  return (
    <Link to={to}>
      <Card className="hover:bg-slate-800/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className={`${color} mb-2`}>{icon}</div>
          <div className="text-2xl font-bold text-slate-100">{value}</div>
          <div className="text-xs text-slate-400">{label}</div>
          <div className="text-xs text-slate-500 mt-1">{subtext}</div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface QuickLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

function QuickLink({ to, icon, label }: QuickLinkProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg text-slate-300 hover:text-slate-100 transition-colors"
    >
      {icon}
      <span className="text-sm">{label}</span>
    </Link>
  );
}
