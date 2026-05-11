import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Calendar,
  Clock,
  Info,
  Sparkles,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { ALL_CHARACTERS } from '@/lib/constants/characterList';
import AddBannerForm, { type PlannedBannerDraft } from '../components/AddBannerForm';
import BannerResourceCard from '../components/BannerResourceCard';
import PlannedBannerCard from '../components/PlannedBannerCard';
import { upcomingWishRepo } from '../repo/upcomingWishRepo';

export default function BannersTab() {
  const plannedBanners = useLiveQuery(() => upcomingWishRepo.getAll(), []);
  const isLoading = plannedBanners === undefined;
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleCreate = async (draft: PlannedBannerDraft) => {
    setError('');
    await upcomingWishRepo.create(draft);
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

      <AddBannerForm characterOptions={characterOptions} onCreate={handleCreate} />

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

        {error && <p className="text-sm text-red-400">{error}</p>}

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
          <BannerResourceCard
            icon={Calendar}
            title="Paimon.moe Timeline"
            description="Event calendar, banner schedule, and countdown timers"
            url="https://paimon.moe/timeline"
            primary
          />
          <BannerResourceCard
            icon={Clock}
            title="Paimon.moe Wish Counter"
            description="Wish import, pity tracking, and pull statistics"
            url="https://paimon.moe/wish"
            primary
          />
          <BannerResourceCard
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
