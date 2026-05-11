import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Sparkles, Target } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import type { TargetSummary } from '../domain/targetSummary';

interface TargetSummaryListProps {
  targets: TargetSummary[];
  maxItems?: number;
}

function getStatusVariant(status: TargetSummary['status']): 'primary' | 'warning' | 'success' | 'outline' | 'default' {
  if (status === 'active') return 'primary';
  if (status === 'planned' || status === 'paused') return 'warning';
  if (status === 'completed') return 'success';
  return 'outline';
}

export default function TargetSummaryList({ targets, maxItems = 4 }: TargetSummaryListProps) {
  const visibleTargets = targets.slice(0, maxItems);

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary-400" />
          <h2 className="text-lg font-semibold text-slate-100">Targets</h2>
        </div>
        <Link to="/campaigns" className="inline-flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300">
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {visibleTargets.length === 0 ? (
        <div className="rounded-lg bg-slate-950/60 p-4 text-sm text-slate-400">
          No targets yet. Start with a character, planned banner, or wishlist item.
        </div>
      ) : (
        <div className="space-y-2">
          {visibleTargets.map((target) => (
            <div
              key={target.id}
              className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <Link to={target.href} className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge variant={getStatusVariant(target.status)}>{target.status}</Badge>
                  <Badge variant="outline">P{target.priority}</Badge>
                  {target.readinessPercent !== undefined && (
                    <Badge variant={target.readinessPercent >= 80 ? 'success' : 'warning'}>
                      {target.readinessPercent}% ready
                    </Badge>
                  )}
                </div>
                <div className="truncate text-sm font-semibold text-slate-100">{target.title}</div>
                <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
                  {target.kind === 'pull' ? <Sparkles className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
                  <span className="truncate">{target.subtitle}</span>
                </div>
                {target.nextAction && (
                  <div className="mt-1 truncate text-xs text-primary-300">
                    Next: {target.nextAction.label}
                  </div>
                )}
              </Link>
              <Link
                to={target.actionHref}
                className="inline-flex flex-shrink-0 items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700"
              >
                {target.actionLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
