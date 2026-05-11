import { Link } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import {
  getWishBannerLabel,
  type WishImportImpact,
} from '../domain/importImpact';

export default function ImportImpactSummary({ impact }: { impact: WishImportImpact }) {
  return (
    <div className="rounded-lg border border-primary-700/40 bg-primary-950/20 p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="font-semibold text-primary-100">Import Impact</h4>
          <p className="mt-1 text-sm text-slate-400">
            Pity and guarantee changes are now available to target calculators.
          </p>
        </div>
        {impact.activePullCampaigns > 0 && (
          <Link
            to="/campaigns"
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            Review Target Odds
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {impact.rows.map((row) => (
          <div key={row.banner} className="rounded-lg bg-slate-950/50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-100">{getWishBannerLabel(row.banner)}</span>
              <Badge variant={row.guaranteedAfter ? 'success' : 'outline'}>
                {row.guaranteedAfter ? 'Guaranteed' : 'Not guaranteed'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <ImpactMetric label="Pity" before={row.pityBefore} after={row.pityAfter} />
              <ImpactMetric
                label={row.banner === 'weapon' ? 'Fate points' : 'Guarantee'}
                before={row.banner === 'weapon' ? row.fatePointsBefore ?? 0 : row.guaranteedBefore ? 1 : 0}
                after={row.banner === 'weapon' ? row.fatePointsAfter ?? 0 : row.guaranteedAfter ? 1 : 0}
                format={row.banner === 'weapon' ? undefined : (value) => (value > 0 ? 'Yes' : 'No')}
              />
            </div>
          </div>
        ))}
      </div>
      {impact.activePullCampaigns > 0 && (
        <p className="mt-3 text-xs text-slate-500">
          {impact.activePullCampaigns} active pull target
          {impact.activePullCampaigns === 1 ? '' : 's'} can use the updated pity state.
        </p>
      )}
    </div>
  );
}

function ImpactMetric({
  label,
  before,
  after,
  format = (value: number) => String(value),
}: {
  label: string;
  before: number;
  after: number;
  format?: (value: number) => string;
}) {
  return (
    <div>
      <div className="text-slate-500">{label}</div>
      <div className="mt-0.5 font-medium text-slate-200">
        {format(before)} → {format(after)}
      </div>
    </div>
  );
}
