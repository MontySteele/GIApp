import { AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import type { WishDataFreshness } from '../services/wishDataFreshness';

type WishFreshnessVariant = 'card' | 'compact';

interface WishDataFreshnessCalloutProps {
  freshness: WishDataFreshness;
  variant?: WishFreshnessVariant;
  className?: string;
}

function getBadgeLabel(status: WishDataFreshness['status']): string {
  if (status === 'missing') return 'Wish import needed';
  if (status === 'stale') return 'Wish data stale';
  return 'Current';
}

function getCtaLabel(status: WishDataFreshness['status']): string {
  return status === 'missing' ? 'Import Wishes' : 'Refresh Wishes';
}

export default function WishDataFreshnessCallout({
  freshness,
  variant = 'card',
  className = '',
}: WishDataFreshnessCalloutProps) {
  if (freshness.isLoading || freshness.status === 'fresh') {
    return null;
  }

  const badgeLabel = getBadgeLabel(freshness.status);
  const ctaLabel = getCtaLabel(freshness.status);

  if (variant === 'compact') {
    return (
      <Link
        to="/pulls/history"
        className={`flex items-center justify-between gap-3 rounded-lg border border-amber-900/60 bg-amber-950/20 px-3 py-2 text-sm transition-colors hover:bg-amber-950/40 ${className}`}
      >
        <span className="flex min-w-0 items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
          <span className="min-w-0">
            <span className="block font-medium text-amber-200">{freshness.label}</span>
            <span className="block truncate text-xs text-amber-200/70">{freshness.detail}</span>
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
          <p className="mt-1 text-sm text-slate-400">{freshness.detail}</p>
        </div>
        <Link
          to="/pulls/history"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-500"
        >
          <RefreshCw className="w-4 h-4" />
          {ctaLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
