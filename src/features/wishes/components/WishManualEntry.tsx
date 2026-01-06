import { useState } from 'react';
import type { BannerType } from '@/types';
import type { WishHistoryItem } from '../domain/wishAnalyzer';
import { wishRepo } from '../repo/wishRepo';
import {
  loadWishHistoryFromRepo,
  wishHistoryItemToRecord,
} from '../utils/wishHistory';

interface WishManualEntryProps {
  onEntrySaved?: (wishes: WishHistoryItem[]) => void;
}

export function WishManualEntry({ onEntrySaved }: WishManualEntryProps) {
  const [name, setName] = useState('');
  const [banner, setBanner] = useState<BannerType>('character');
  const [rarity, setRarity] = useState<3 | 4 | 5>(5);
  const [itemType, setItemType] = useState<'character' | 'weapon'>('character');
  const [timestamp, setTimestamp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    if (!timestamp) {
      setError('Please provide the time of the wish.');
      return;
    }

    const parsedDate = new Date(timestamp);
    if (Number.isNaN(parsedDate.getTime())) {
      setError('Invalid date format.');
      return;
    }

    try {
      setIsSaving(true);
      const manualWish: WishHistoryItem = {
        id: `manual-${crypto.randomUUID()}`,
        name: name.trim(),
        rarity,
        itemType,
        time: parsedDate.toISOString(),
        banner,
      };

      await wishRepo.create(wishHistoryItemToRecord(manualWish));
      const history = await loadWishHistoryFromRepo();
      setSuccess('Wish saved to your history.');
      onEntrySaved?.(history);
      setName('');
      setTimestamp('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save wish.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Add Wish Manually</h2>
        <p className="text-sm text-slate-400">
          Record a wish directly if you have export data from another source.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="wish-name" className="block text-sm font-medium text-slate-300 mb-1">
              Item Name
            </label>
            <input
              id="wish-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Furina or Redhorn Stonethresher"
              disabled={isSaving}
            />
          </div>

          <div>
            <label htmlFor="wish-time" className="block text-sm font-medium text-slate-300 mb-1">
              Time
            </label>
            <input
              id="wish-time"
              type="datetime-local"
              value={timestamp}
              onChange={(event) => setTimestamp(event.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="wish-banner" className="block text-sm font-medium text-slate-300 mb-1">
              Banner
            </label>
            <select
              id="wish-banner"
              value={banner}
              onChange={(event) => setBanner(event.target.value as BannerType)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isSaving}
            >
              <option value="character">Character Event</option>
              <option value="weapon">Weapon Event</option>
              <option value="standard">Standard</option>
              <option value="chronicled">Chronicled Wish</option>
            </select>
          </div>

          <div>
            <label htmlFor="wish-rarity" className="block text-sm font-medium text-slate-300 mb-1">
              Rarity
            </label>
            <select
              id="wish-rarity"
              value={rarity}
              onChange={(event) => setRarity(parseInt(event.target.value, 10) as 3 | 4 | 5)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isSaving}
            >
              <option value={5}>5-Star</option>
              <option value={4}>4-Star</option>
              <option value={3}>3-Star</option>
            </select>
          </div>

          <div>
            <label htmlFor="wish-type" className="block text-sm font-medium text-slate-300 mb-1">
              Item Type
            </label>
            <select
              id="wish-type"
              value={itemType}
              onChange={(event) => setItemType(event.target.value as 'character' | 'weapon')}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isSaving}
            >
              <option value="character">Character</option>
              <option value="weapon">Weapon</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3 border border-red-500 rounded bg-red-900/30 text-red-200 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 border border-green-500 rounded bg-green-900/30 text-green-200 text-sm">
            {success}
          </div>
        )}

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Add Wish'}
        </button>
      </form>
    </div>
  );
}
