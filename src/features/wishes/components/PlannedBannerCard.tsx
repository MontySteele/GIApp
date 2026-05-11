import { Link } from 'react-router-dom';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { buildPlannedBannerCampaignUrl } from '@/features/campaigns/lib/campaignLinks';
import { getDisplayName } from '@/lib/gameData';
import type { PlannedBanner } from '@/types';
import { formatBannerDate, getBannerTimingLabel, getDateOnly } from '../lib/bannerDates';
import { buildBannerCalculatorUrl } from '../lib/bannerLinks';

interface PlannedBannerCardProps {
  banner: PlannedBanner;
  isDeleting: boolean;
  onDelete: () => void;
}

export default function PlannedBannerCard({
  banner,
  isDeleting,
  onDelete,
}: PlannedBannerCardProps) {
  const displayName = getDisplayName(banner.characterKey);
  const campaignHref = buildPlannedBannerCampaignUrl(banner);
  const startDate = getDateOnly(banner.expectedStartDate);
  const endDate = getDateOnly(banner.expectedEndDate);
  const windowLabel = `${startDate ? formatBannerDate(startDate) : 'Unknown'} - ${
    endDate ? formatBannerDate(endDate) : 'Unknown'
  }`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant={banner.isConfirmed ? 'success' : 'warning'}>
                {banner.isConfirmed ? 'Confirmed' : 'Speculative'}
              </Badge>
              <Badge variant="outline">P{banner.priority}</Badge>
              <Badge variant="secondary">{getBannerTimingLabel(banner)}</Badge>
            </div>
            <h3 className="truncate text-lg font-semibold text-slate-100">{displayName}</h3>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onDelete}
            loading={isDeleting}
            aria-label={`Delete planned banner for ${displayName}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <BannerStat
            label="Window"
            value={windowLabel}
          />
          <BannerStat
            label="Budget"
            value={banner.maxPullBudget ? `${banner.maxPullBudget} pulls` : 'No cap'}
          />
          <BannerStat label="Priority" value={`P${banner.priority}`} />
        </div>

        {banner.notes && (
          <p className="rounded-lg bg-slate-900/70 p-3 text-sm text-slate-400">{banner.notes}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Link
            to={campaignHref}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            Add to Campaign
          </Link>
          <Link
            to={buildBannerCalculatorUrl(banner)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-600"
          >
            <Sparkles className="w-4 h-4" />
            Simulate
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function BannerStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-900 p-3">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-sm font-medium text-slate-100">{value}</div>
    </div>
  );
}
