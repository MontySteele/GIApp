import { useEffect, useMemo, useState } from 'react';
import type { BannerType } from '@/types';
import type { WishHistoryItem } from '../domain/wishAnalyzer';
import { analyzeWishHistory } from '../domain/wishAnalyzer';
import { wishRepo } from '../repo/wishRepo';
import { WishImport } from '../components/WishImport';
import { WishHistoryList } from '../components/WishHistoryList';
import { WishStatistics } from '../components/WishStatistics';
import { PityTracker } from '../components/PityTracker';
import { useWishRecords } from '../repo/hooks/useWishRecords';
import { toWishHistoryItem, toWishRecord } from '../lib/wishNormalization';
import { mapHistoryToWishRecords } from '../mappers/wishHistoryMapper';

export function WishHistoryPage() {
  const [sessionHistory, setSessionHistory] = useState<WishHistoryItem[]>([]);
  const [selectedBanner, setSelectedBanner] = useState<BannerType>('character');
  const [showImport, setShowImport] = useState(true);
  const [persistError, setPersistError] = useState('');
  const { wishes: storedWishes, addWishes, isLoading } = useWishRecords();

  const storedHistory = useMemo(
    () => storedWishes.map((wish) => toWishHistoryItem(wish)),
    [storedWishes]
  );

  const history = storedHistory.length > 0 ? storedHistory : sessionHistory;
  const hasPersistedHistory = storedHistory.length > 0;

  useEffect(() => {
    if (!isLoading && storedHistory.length > 0) {
      setShowImport(false);
    }
  }, [isLoading, storedHistory.length]);

  // Handle import completion
  const handleImportComplete = async (wishes: WishHistoryItem[]) => {
    setSessionHistory(wishes);
    setPersistError('');

    try {
      const records = wishes.map((wish) => toWishRecord(wish));
      await addWishes(records);
      setShowImport(false);
    } catch (error) {
      console.error('Failed to persist wishes', error);
      setPersistError('Imported wishes are available for this session, but saving them for later failed.');
      setShowImport(false);
    }
  };

  // Analyze current banner
  const analysis = analyzeWishHistory(history, selectedBanner);

  // Banner tabs
  const banners: Array<{ type: BannerType; label: string }> = [
    { type: 'character', label: 'Character Event' },
    { type: 'weapon', label: 'Weapon Event' },
    { type: 'standard', label: 'Standard' },
    { type: 'chronicled', label: 'Chronicled Wish' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Wish History Tracker</h1>
        <p className="text-slate-400">
          Track your wish history, pity counters, and pull statistics across all banners.
        </p>
      </div>

      {/* Show import section if no history or user wants to re-import */}
      {showImport ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow p-6">
          <WishImport onImportComplete={handleImportComplete} />
        </div>
      ) : (
        <>
          {/* Re-import button */}
          <div className="mb-6">
            <button
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 hover:bg-slate-700 transition-colors"
              onClick={() => setShowImport(true)}
            >
              Re-import Wish History
            </button>
          </div>

          {/* Banner tabs */}
          <div className="mb-6">
            <div className="border-b border-slate-700">
              <nav className="flex gap-4">
                {banners.map(({ type, label }) => (
                  <button
                    key={type}
                    className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                      selectedBanner === type
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                    onClick={() => setSelectedBanner(type)}
                  >
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {!hasPersistedHistory && (
            <div className="mb-4 p-4 bg-slate-800 border border-slate-700 rounded-lg text-slate-300">
              <p className="text-sm">
                Showing imported wishes for this session. They will be saved locally whenever storage is available.
              </p>
              {persistError && (
                <p className="text-sm text-red-400 mt-2">
                  {persistError}
                </p>
              )}
            </div>
          )}

          {/* Pity Tracker */}
          <div className="mb-6 bg-slate-800 border border-slate-700 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Current Pity</h2>
            <PityTracker pityState={analysis.pityState} bannerType={selectedBanner} />
          </div>

          {/* Statistics */}
          <div className="mb-6 bg-slate-800 border border-slate-700 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Statistics</h2>
            <WishStatistics stats={analysis.stats} bannerType={selectedBanner} />
          </div>

          {/* Wish History List */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Wish History</h2>
            <WishHistoryList history={history} />
          </div>
        </>
      )}
    </div>
  );
}
