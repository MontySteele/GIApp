import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { BannerType } from '@/types';
import type { WishHistoryItem } from '../domain/wishAnalyzer';
import { analyzeWishHistory } from '../domain/wishAnalyzer';
import { WishImport } from '../components/WishImport';
import { WishHistoryList } from '../components/WishHistoryList';
import { WishStatistics } from '../components/WishStatistics';
import { PityTracker } from '../components/PityTracker';
import { WishManualEntry } from '../components/WishManualEntry';
import { PullHistoryChart } from '../components/PullHistoryChart';
import { loadWishHistoryFromRepo } from '../utils/wishHistory';
import { useUIStore } from '@/stores/uiStore';

export function WishHistoryPage() {
  const [wishHistory, setWishHistory] = useState<WishHistoryItem[]>([]);
  const [selectedBanner, setSelectedBanner] = useState<BannerType>('character');
  const [showImport, setShowImport] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [manualEntryExpanded, setManualEntryExpanded] = useState(false);

  const { settings } = useUIStore();

  // Sync with settings when they change
  useEffect(() => {
    setManualEntryExpanded(settings.showManualWishEntry);
  }, [settings.showManualWishEntry]);

  const loadHistory = async () => {
    const history = await loadWishHistoryFromRepo();
    setWishHistory(history);
    setShowImport(history.length === 0);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  // Handle import completion
  const handleImportComplete = (wishes: WishHistoryItem[]) => {
    setWishHistory(wishes);
    setShowImport(false);
  };

  const handleManualEntrySaved = (wishes: WishHistoryItem[]) => {
    setWishHistory(wishes);
    setShowImport(false);
  };

  // Analyze current banner
  const analysis = analyzeWishHistory(wishHistory, selectedBanner);

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

      {isLoading && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow p-6 mb-6">
          <p className="text-slate-300">Loading wish history...</p>
        </div>
      )}

      {/* Show import section if no history or user wants to re-import */}
      {!isLoading && showImport ? (
        <div className="space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow p-6">
            <WishImport onImportComplete={handleImportComplete} />
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow p-6">
            <WishManualEntry onEntrySaved={handleManualEntrySaved} />
          </div>
        </div>
      ) : !isLoading && (
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

          {/* Collapsible Manual Entry Section */}
          <div className="mb-6 bg-slate-800 border border-slate-700 rounded-lg shadow">
            <button
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-750 transition-colors rounded-lg"
              onClick={() => setManualEntryExpanded(!manualEntryExpanded)}
            >
              <span className="text-lg font-semibold text-slate-200">Manual Wish Entry</span>
              {manualEntryExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
            {manualEntryExpanded && (
              <div className="px-6 pb-6 border-t border-slate-700">
                <WishManualEntry onEntrySaved={handleManualEntrySaved} />
              </div>
            )}
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

          {/* Pity Tracker */}
          <div className="mb-6 bg-slate-800 border border-slate-700 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Current Pity</h2>
            <PityTracker pityState={analysis.pityState} bannerType={selectedBanner} />
          </div>

          {/* Pull History Chart */}
          <div className="mb-6 bg-slate-800 border border-slate-700 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Pull History</h2>
            <PullHistoryChart history={wishHistory} bannerType={selectedBanner} />
          </div>

          {/* Statistics */}
          <div className="mb-6 bg-slate-800 border border-slate-700 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Statistics</h2>
            <WishStatistics stats={analysis.stats} bannerType={selectedBanner} />
          </div>

          {/* Wish History List */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Wish History</h2>
            <WishHistoryList history={wishHistory} />
          </div>
        </>
      )}
    </div>
  );
}
