import { useState } from 'react';
import type { BannerType } from '@/types';
import type { WishHistoryItem } from '../domain/wishAnalyzer';
import { analyzeWishHistory } from '../domain/wishAnalyzer';
import { WishImport } from '../components/WishImport';
import { WishHistoryList } from '../components/WishHistoryList';
import { WishStatistics } from '../components/WishStatistics';
import { PityTracker } from '../components/PityTracker';

export function WishHistoryPage() {
  const [wishHistory, setWishHistory] = useState<WishHistoryItem[]>([]);
  const [selectedBanner, setSelectedBanner] = useState<BannerType>('character');
  const [showImport, setShowImport] = useState(true);

  // Handle import completion
  const handleImportComplete = (wishes: WishHistoryItem[]) => {
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
        <p className="text-gray-600 dark:text-gray-400">
          Track your wish history, pity counters, and pull statistics across all banners.
        </p>
      </div>

      {/* Show import section if no history or user wants to re-import */}
      {showImport ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <WishImport onImportComplete={handleImportComplete} />
        </div>
      ) : (
        <>
          {/* Re-import button */}
          <div className="mb-6">
            <button
              className="px-4 py-2 border rounded-md hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              onClick={() => setShowImport(true)}
            >
              Re-import Wish History
            </button>
          </div>

          {/* Banner tabs */}
          <div className="mb-6">
            <div className="border-b dark:border-gray-700">
              <nav className="flex gap-4">
                {banners.map(({ type, label }) => (
                  <button
                    key={type}
                    className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                      selectedBanner === type
                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
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
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Current Pity</h2>
            <PityTracker pityState={analysis.pityState} bannerType={selectedBanner} />
          </div>

          {/* Statistics */}
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Statistics</h2>
            <WishStatistics stats={analysis.stats} bannerType={selectedBanner} />
          </div>

          {/* Wish History List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Wish History</h2>
            <WishHistoryList history={wishHistory} />
          </div>
        </>
      )}
    </div>
  );
}
