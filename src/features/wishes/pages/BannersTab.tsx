import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Calendar,
  Clock,
  ExternalLink,
  Info,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import SearchableSelect from '@/components/ui/SearchableSelect';
import Select from '@/components/ui/Select';
import { buildPlannedBannerCampaignUrl } from '@/features/campaigns/lib/campaignLinks';
import { ALL_CHARACTERS } from '@/lib/constants/characterList';
import { getDisplayName } from '@/lib/gameData';
import type { Campaign, PlannedBanner } from '@/types';
import { upcomingWishRepo } from '../repo/upcomingWishRepo';

const PRIORITY_OPTIONS = [
  { value: '1', label: '1 - Must pull' },
  { value: '2', label: '2 - High' },
  { value: '3', label: '3 - Maybe' },
  { value: '4', label: '4 - Low' },
  { value: '5', label: '5 - Watchlist' },
];

const STATUS_OPTIONS = [
  { value: 'speculative', label: 'Speculative' },
  { value: 'confirmed', label: 'Confirmed' },
];

const DEFAULT_CHARACTER_KEY =
  ALL_CHARACTERS.find((character) => character.key === 'Furina')?.key ??
  ALL_CHARACTERS[0]?.key ??
  '';

function openExternal(url: string) {
  open(url).catch((err) => {
    console.error('Failed to open URL:', err);
    window.open(url, '_blank', 'noopener,noreferrer');
  });
}

function addDaysToDateInput(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getInitialDateRange(): { start: string; end: string } {
  const start = new Date().toISOString().slice(0, 10);
  return { start, end: addDaysToDateInput(start, 20) };
}

function toIsoDate(value: string, endOfDay = false): string {
  return `${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getBannerTimingLabel(banner: PlannedBanner): string {
  const start = new Date(banner.expectedStartDate).getTime();
  const end = new Date(banner.expectedEndDate).getTime();
  const now = Date.now();

  if (Number.isNaN(start) || Number.isNaN(end)) return 'Needs dates';
  if (end < now) return 'Ended';
  if (start <= now && end >= now) return 'Live now';

  const days = Math.ceil((start - now) / 86_400_000);
  if (days <= 0) return 'Starts today';
  return days === 1 ? 'Starts tomorrow' : `Starts in ${days} days`;
}

function buildBannerCalculatorUrl(banner: PlannedBanner): string {
  const params = new URLSearchParams({
    mode: 'multi',
    name: `${getDisplayName(banner.characterKey)} banner`,
  });

  if (banner.maxPullBudget) {
    params.set('pulls', String(banner.maxPullBudget));
  }

  params.append(
    'target',
    JSON.stringify({
      name: banner.characterKey,
      banner: 'character',
      copies: 1,
    })
  );

  return `/pulls/calculator?${params.toString()}`;
}

export default function BannersTab() {
  const plannedBanners = useLiveQuery(() => upcomingWishRepo.getAll(), []);
  const isLoading = plannedBanners === undefined;
  const dateRange = useMemo(() => getInitialDateRange(), []);
  const characterOptions = useMemo(
    () =>
      ALL_CHARACTERS
        .map((character) => ({
          value: character.key,
          label: character.name,
          sublabel: `${character.rarity} star ${character.element} ${character.weapon}`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    []
  );
  const [characterKey, setCharacterKey] = useState(DEFAULT_CHARACTER_KEY);
  const [expectedStartDate, setExpectedStartDate] = useState(dateRange.start);
  const [expectedEndDate, setExpectedEndDate] = useState(dateRange.end);
  const [priority, setPriority] = useState<Campaign['priority']>(2);
  const [maxPullBudget, setMaxPullBudget] = useState('');
  const [status, setStatus] = useState('speculative');
  const [notes, setNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const resetDraft = () => {
    const nextRange = getInitialDateRange();
    setExpectedStartDate(nextRange.start);
    setExpectedEndDate(nextRange.end);
    setMaxPullBudget('');
    setStatus('speculative');
    setNotes('');
    setError('');
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const normalizedCharacterKey = characterKey.trim();
    if (!normalizedCharacterKey) {
      setError('Choose a banner character.');
      return;
    }
    if (!expectedStartDate || !expectedEndDate) {
      setError('Choose the expected banner window.');
      return;
    }
    if (expectedEndDate < expectedStartDate) {
      setError('Expected end date must be after the start date.');
      return;
    }

    const parsedBudget = Number(maxPullBudget);
    setIsCreating(true);
    try {
      await upcomingWishRepo.create({
        characterKey: normalizedCharacterKey,
        expectedStartDate: toIsoDate(expectedStartDate),
        expectedEndDate: toIsoDate(expectedEndDate, true),
        priority,
        maxPullBudget: Number.isFinite(parsedBudget) && parsedBudget > 0 ? Math.floor(parsedBudget) : null,
        isConfirmed: status === 'confirmed',
        notes,
      });
      resetDraft();
    } catch {
      setError('Failed to save planned banner. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (bannerId: string) => {
    setDeletingId(bannerId);
    setError('');
    try {
      await upcomingWishRepo.delete(bannerId);
    } catch {
      setError('Failed to delete planned banner.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Banner Planning</h1>
        <p className="text-slate-400">
          Track likely banners and turn them into pull campaigns when they matter.
        </p>
      </div>

      <Card className="border-primary-500/30 bg-primary-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-primary-400">Local planning, external confirmation</h3>
              <p className="text-sm text-slate-400 mt-1">
                Keep speculative and confirmed targets here, then open a campaign to connect the banner to budget, pity, and pre-farming.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold">Add Planned Banner</h2>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]">
              <SearchableSelect
                label="Banner character"
                placeholder="Search or type an unreleased character..."
                options={characterOptions}
                value={characterKey}
                onChange={setCharacterKey}
                allowFreeText
                required
              />
              <Input
                label="Expected start"
                type="date"
                value={expectedStartDate}
                onChange={(event) => {
                  const nextStart = event.target.value;
                  setExpectedStartDate(nextStart);
                  if (!expectedEndDate || expectedEndDate < nextStart) {
                    setExpectedEndDate(addDaysToDateInput(nextStart, 20));
                  }
                }}
                required
              />
              <Input
                label="Expected end"
                type="date"
                value={expectedEndDate}
                onChange={(event) => setExpectedEndDate(event.target.value)}
                required
              />
              <Select
                label="Priority"
                value={String(priority)}
                onChange={(event) => setPriority(Number(event.target.value) as Campaign['priority'])}
                options={PRIORITY_OPTIONS}
              />
              <Input
                label="Pull budget"
                type="number"
                min="0"
                value={maxPullBudget}
                onChange={(event) => setMaxPullBudget(event.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)]">
              <Select
                label="Status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                options={STATUS_OPTIONS}
              />
              <Input
                label="Notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Source, rerun confidence, weapon pairing, or savings note"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button type="submit" loading={isCreating}>
              <Plus className="w-4 h-4" />
              Add Banner
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Planned Banner Targets</h2>
            <p className="text-sm text-slate-400">
              Use these cards as a staging area before committing to a full campaign.
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            {plannedBanners?.length ?? 0} planned
          </Badge>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="h-48 rounded-lg bg-slate-800 animate-pulse" />
            <div className="h-48 rounded-lg bg-slate-800 animate-pulse" />
          </div>
        ) : plannedBanners.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-300 mb-1">No planned banners yet</h3>
              <p className="text-slate-400">
                Add a speculative or confirmed banner to make wishlist targets easier to act on.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {plannedBanners.map((banner) => (
              <PlannedBannerCard
                key={banner.id}
                banner={banner}
                isDeleting={deletingId === banner.id}
                onDelete={() => handleDelete(banner.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Reference Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <ResourceCard
            icon={Calendar}
            title="Paimon.moe Timeline"
            description="Event calendar, banner schedule, and countdown timers"
            url="https://paimon.moe/timeline"
            primary
          />
          <ResourceCard
            icon={Clock}
            title="Paimon.moe Wish Counter"
            description="Wish import, pity tracking, and pull statistics"
            url="https://paimon.moe/wish"
            primary
          />
          <ResourceCard
            icon={Sparkles}
            title="Samsara Banner Tracker"
            description="Rerun history and time since last appearance"
            url="https://samsara.pages.dev/"
          />
        </div>
      </section>
    </div>
  );
}

function PlannedBannerCard({
  banner,
  isDeleting,
  onDelete,
}: {
  banner: PlannedBanner;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  const displayName = getDisplayName(banner.characterKey);
  const campaignHref = buildPlannedBannerCampaignUrl(banner);

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
            value={`${formatDate(banner.expectedStartDate)} - ${formatDate(banner.expectedEndDate)}`}
          />
          <BannerStat
            label="Budget"
            value={banner.maxPullBudget ? `${banner.maxPullBudget} pulls` : 'No cap'}
          />
          <BannerStat label="Target" value="1 copy" />
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

function ResourceCard({
  icon: Icon,
  title,
  description,
  url,
  primary = false,
}: {
  icon: typeof Calendar;
  title: string;
  description: string;
  url: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => openExternal(url)}
      className={`text-left w-full p-4 rounded-lg border transition-colors group ${
        primary
          ? 'bg-primary-500/10 border-primary-500/30 hover:border-primary-500/50'
          : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${primary ? 'bg-primary-500/20' : 'bg-slate-700'}`}>
          <Icon className={`w-5 h-5 ${primary ? 'text-primary-400' : 'text-slate-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`font-medium group-hover:text-primary-400 transition-colors ${
              primary ? 'text-primary-300' : 'text-slate-200'
            }`}>
              {title}
            </h3>
            <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-primary-400 transition-colors flex-shrink-0" />
          </div>
          <p className="text-sm text-slate-400 mt-1">{description}</p>
        </div>
      </div>
    </button>
  );
}
