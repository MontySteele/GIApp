import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowRight,
  Database,
  FileJson,
  History,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { db } from '@/db/schema';
import FirstTargetSetupCard from '@/features/targets/components/FirstTargetSetupCard';
import { buildFirstTargetSetupState } from '@/features/targets/domain/firstTargetSetup';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useAccountDataFreshness } from '../hooks/useAccountDataFreshness';
import { useAppMetaStatus } from '../hooks/useAppMetaStatus';
import { readLastImportSummary, type LastImportSummary } from '../domain/lastImportSummary';

interface HubStatusCard {
  id: string;
  title: string;
  detail: string;
  status: 'ready' | 'attention' | 'missing';
  href: string;
  action: string;
  icon: LucideIcon;
}

function formatCount(count: number | undefined, noun: string): string {
  const safeCount = count ?? 0;
  return `${safeCount} ${noun}${safeCount === 1 ? '' : 's'}`;
}

function formatImportedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'recently';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function statusVariant(status: HubStatusCard['status']): 'success' | 'warning' | 'outline' {
  if (status === 'ready') return 'success';
  if (status === 'attention') return 'warning';
  return 'outline';
}

export default function ImportHubPage() {
  const characterCount = useLiveQuery(() => db.characters.count(), []);
  const wishCount = useLiveQuery(() => db.wishRecords.count(), []);
  const resourceSnapshotCount = useLiveQuery(() => db.resourceSnapshots.count(), []);
  const campaignCount = useLiveQuery(() => db.campaigns.count(), []);
  const plannedBannerCount = useLiveQuery(() => db.plannedBanners.count(), []);
  const wishlistCharacters = useWishlistStore((state) => state.characters);
  const accountFreshness = useAccountDataFreshness();
  const { status: appMeta } = useAppMetaStatus();
  const [lastSummary] = useState<LastImportSummary | null>(() => readLastImportSummary());
  const safeCampaignCount = campaignCount ?? 0;
  const safePlannedBannerCount = plannedBannerCount ?? 0;
  const wishlistCount = wishlistCharacters.length;
  const targetSurfaceCount = safeCampaignCount + safePlannedBannerCount + wishlistCount;
  const firstTargetSetup = useMemo(() => buildFirstTargetSetupState({
    characterCount: characterCount ?? 0,
    wishHistoryCount: wishCount ?? 0,
    resourceSnapshotCount: resourceSnapshotCount ?? 0,
    targetCount: targetSurfaceCount > 0 ? 1 : 0,
    accountFreshnessStatus: accountFreshness.status,
    accountFreshnessDetail: accountFreshness.detail,
  }), [
    accountFreshness.detail,
    accountFreshness.status,
    characterCount,
    resourceSnapshotCount,
    targetSurfaceCount,
    wishCount,
  ]);
  const showFirstTargetSetup = targetSurfaceCount === 0 && firstTargetSetup.activeStep !== 'review-plan';

  const cards = useMemo<HubStatusCard[]>(() => [
    {
      id: 'roster',
      title: 'Roster and inventory',
      detail: accountFreshness.detail || 'Import characters, weapons, artifacts, and materials.',
      status: accountFreshness.status === 'fresh' ? 'ready' : accountFreshness.status === 'stale' ? 'attention' : 'missing',
      href: '/roster?import=irminsul',
      action: characterCount ? 'Refresh roster' : 'Import roster',
      icon: Users,
    },
    {
      id: 'wishes',
      title: 'Wish history',
      detail: wishCount
        ? `${formatCount(wishCount, 'wish')} available for pity, guarantee, and target odds.`
        : 'Import wish history or enter pity manually to unlock target odds.',
      status: wishCount ? 'ready' : 'missing',
      href: '/pulls/history',
      action: wishCount ? 'Refresh wishes' : 'Import wishes',
      icon: History,
    },
    {
      id: 'manual',
      title: 'Manual fast path',
      detail: 'Start with pity, guarantee, pulls saved, and a target before importing anything.',
      status: 'ready',
      href: '/pulls/calculator',
      action: 'Enter manually',
      icon: Sparkles,
    },
    {
      id: 'backup',
      title: 'Backup and restore',
      detail: appMeta.lastBackupAt
        ? `Last backup ${formatImportedAt(appMeta.lastBackupAt)}.`
        : 'Create a backup before larger imports or device changes.',
      status: appMeta.needsBackup ? 'attention' : 'ready',
      href: '/settings',
      action: appMeta.needsBackup ? 'Back up data' : 'Open sync',
      icon: ShieldCheck,
    },
  ], [accountFreshness.detail, accountFreshness.status, appMeta.lastBackupAt, appMeta.needsBackup, characterCount, wishCount]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-bold">Import Hub</h1>
          <p className="text-slate-400">Account setup, refresh status, and manual fallbacks in one place.</p>
        </div>
        <Link
          to="/roster?import=irminsul"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          Import Data
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Snapshot label="Characters" value={characterCount ?? 0} icon={Users} />
        <Snapshot label="Wish records" value={wishCount ?? 0} icon={History} />
        <Snapshot label="Resource snapshots" value={resourceSnapshotCount ?? 0} icon={Database} />
        <Snapshot label="Targets" value={targetSurfaceCount} icon={Target} />
      </div>

      {showFirstTargetSetup && <FirstTargetSetupCard setup={firstTargetSetup} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.id}>
              <CardHeader className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 text-primary-300">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-slate-100">{card.title}</h2>
                    <p className="mt-1 text-sm text-slate-400">{card.detail}</p>
                  </div>
                </div>
                <Badge variant={statusVariant(card.status)}>{card.status}</Badge>
              </CardHeader>
              <CardContent>
                <Link
                  to={card.href}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary-300 hover:text-primary-200"
                >
                  {card.action}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {lastSummary && (
        <Card>
          <CardHeader className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary-300" aria-hidden="true" />
              <h2 className="font-semibold text-slate-100">Last Import Impact</h2>
            </div>
            <Badge variant="outline">{lastSummary.source}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Snapshot label="Created" value={lastSummary.totals.created} icon={FileJson} compact />
              <Snapshot label="Updated" value={lastSummary.totals.updated} icon={RefreshCw} compact />
              <Snapshot label="Skipped" value={lastSummary.totals.skipped} icon={Database} compact />
            </div>
            {lastSummary.rows.length > 0 && (
              <div className="space-y-2">
                {lastSummary.rows.map((row) => (
                  <Link
                    key={row.id}
                    to={row.href}
                    className="block rounded-lg bg-slate-950 p-3 transition-colors hover:bg-slate-900"
                  >
                    <div className="text-sm font-medium text-slate-100">{row.title}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{row.detail}</div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Snapshot({
  label,
  value,
  icon: Icon,
  compact = false,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-lg border border-slate-800 bg-slate-900 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">{label}</span>
        <Icon className="h-4 w-4 text-slate-500" aria-hidden="true" />
      </div>
      <div className="text-2xl font-bold text-slate-100">{value.toLocaleString()}</div>
    </div>
  );
}
