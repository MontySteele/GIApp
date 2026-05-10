import { AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import type { AccountDataFreshness } from '../hooks/useAccountDataFreshness';

type FreshnessContext = 'campaign' | 'materials' | 'farming' | 'calculator';
type FreshnessVariant = 'card' | 'compact';

interface AccountDataFreshnessCalloutProps {
  freshness: AccountDataFreshness;
  context?: FreshnessContext;
  variant?: FreshnessVariant;
  className?: string;
}

const CONTEXT_DETAILS: Record<FreshnessContext, Partial<Record<AccountDataFreshness['status'], string>>> = {
  campaign: {
    missing: 'Import from Irminsul/GOOD so campaign readiness can use your current roster, weapons, artifacts, materials, and pull resources.',
    stale: 'Campaign readiness, farming gaps, and build gaps may be out of date until you refresh your account import.',
  },
  materials: {
    missing: 'Import material inventory before trusting campaign deficits or resin estimates.',
    stale: 'Material deficits and resin estimates depend on inventory counts from your latest account import.',
  },
  farming: {
    missing: "Import account data to turn today's domain schedule into campaign-specific farming recommendations.",
    stale: "Today's farming recommendations depend on current roster and material inventory data.",
  },
  calculator: {
    missing: 'Import account data before trusting the broader campaign plan that sent you here.',
    stale: 'This pull plan may still calculate correctly, but the campaign readiness behind it could be stale.',
  },
};

function getBadgeLabel(status: AccountDataFreshness['status']): string {
  if (status === 'missing') return 'Import needed';
  if (status === 'stale') return 'Data stale';
  return 'Current';
}

function getCtaLabel(status: AccountDataFreshness['status']): string {
  return status === 'missing' ? 'Import Account Data' : 'Refresh Import';
}

function getDetail(freshness: AccountDataFreshness, context?: FreshnessContext): string {
  return context ? CONTEXT_DETAILS[context][freshness.status] ?? freshness.detail : freshness.detail;
}

export default function AccountDataFreshnessCallout({
  freshness,
  context,
  variant = 'card',
  className = '',
}: AccountDataFreshnessCalloutProps) {
  if (freshness.isLoading || freshness.status === 'fresh') {
    return null;
  }

  const badgeLabel = getBadgeLabel(freshness.status);
  const ctaLabel = getCtaLabel(freshness.status);
  const detail = getDetail(freshness, context);

  if (variant === 'compact') {
    return (
      <Link
        to="/roster?import=irminsul"
        className={`flex items-center justify-between gap-3 rounded-lg border border-amber-900/60 bg-amber-950/20 px-3 py-2 text-sm transition-colors hover:bg-amber-950/40 ${className}`}
      >
        <span className="flex min-w-0 items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
          <span className="min-w-0">
            <span className="block font-medium text-amber-200">{freshness.label}</span>
            <span className="block truncate text-xs text-amber-200/70">{detail}</span>
          </span>
        </span>
        <span className="inline-flex flex-shrink-0 items-center gap-1 text-xs font-medium text-amber-200">
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </Link>
    );
  }

  return (
    <Card className={`border-amber-900/60 bg-amber-950/20 ${className}`}>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2">
            <Badge variant="warning">{badgeLabel}</Badge>
          </div>
          <h2 className="text-base font-semibold text-slate-100">{freshness.label}</h2>
          <p className="mt-1 text-sm text-slate-400">{detail}</p>
        </div>
        <Link
          to="/roster?import=irminsul"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-500"
        >
          <RefreshCw className="w-4 h-4" />
          {ctaLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
