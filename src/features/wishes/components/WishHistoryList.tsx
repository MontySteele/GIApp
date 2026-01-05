import { useState, useMemo } from 'react';
import type { BannerType } from '@/types';
import type { WishHistoryItem } from '../domain/wishAnalyzer';

interface WishHistoryListProps {
  history: WishHistoryItem[];
}

const ITEMS_PER_PAGE = 20;

export function WishHistoryList({ history }: WishHistoryListProps) {
  const [bannerFilter, setBannerFilter] = useState<BannerType | 'all'>('all');
  const [rarityFilter, setRarityFilter] = useState<3 | 4 | 5 | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Apply filters and sorting
  const filteredAndSorted = useMemo(() => {
    let filtered = [...history];

    // Filter by banner
    if (bannerFilter !== 'all') {
      filtered = filtered.filter((item) => item.banner === bannerFilter);
    }

    // Filter by rarity
    if (rarityFilter !== 'all') {
      filtered = filtered.filter((item) => item.rarity === rarityFilter);
    }

    // Sort by newest first
    filtered.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return filtered;
  }, [history, bannerFilter, rarityFilter]);

  // Paginate
  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedItems = filteredAndSorted.slice(startIndex, endIndex);

  // Get rarity color class
  const getRarityClass = (rarity: 3 | 4 | 5) => {
    switch (rarity) {
      case 5:
        return 'bg-amber-100 dark:bg-amber-900 border-amber-500 text-amber-900 dark:text-amber-100';
      case 4:
        return 'bg-purple-100 dark:bg-purple-900 border-purple-500 text-purple-900 dark:text-purple-100';
      case 3:
        return 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-900 dark:text-blue-100';
    }
  };

  // Get banner display name
  const getBannerName = (banner: BannerType) => {
    switch (banner) {
      case 'character':
        return 'Character Event';
      case 'weapon':
        return 'Weapon Event';
      case 'standard':
        return 'Standard';
      case 'chronicled':
        return 'Chronicled Wish';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No wish history available. Import your wish history to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="banner-filter" className="block text-sm font-medium mb-1">
            Filter by Banner
          </label>
          <select
            id="banner-filter"
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
            value={bannerFilter}
            onChange={(e) => {
              setBannerFilter(e.target.value as BannerType | 'all');
              setCurrentPage(1);
            }}
          >
            <option value="all">All Banners</option>
            <option value="character">Character Event</option>
            <option value="weapon">Weapon Event</option>
            <option value="standard">Standard</option>
            <option value="chronicled">Chronicled Wish</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label htmlFor="rarity-filter" className="block text-sm font-medium mb-1">
            Filter by Rarity
          </label>
          <select
            id="rarity-filter"
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
            value={rarityFilter}
            onChange={(e) => {
              setRarityFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value) as 3 | 4 | 5);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Rarities</option>
            <option value="5">5-Star</option>
            <option value="4">4-Star</option>
            <option value="3">3-Star</option>
          </select>
        </div>
      </div>

      {/* Results info */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredAndSorted.length} items
        {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
      </div>

      {/* Wish history list */}
      <ul className="space-y-2">
        {paginatedItems.map((item) => (
          <li
            key={item.id}
            className={`p-4 border-2 rounded-lg ${getRarityClass(item.rarity)}`}
            role="listitem"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-semibold text-lg">{item.name}</div>
                <div className="text-sm space-x-3 mt-1">
                  <span className="capitalize">{item.itemType}</span>
                  <span>•</span>
                  <span>{getBannerName(item.banner)}</span>
                  <span>•</span>
                  <span>{formatDate(item.time)}</span>
                </div>
                {/* Featured/Lost 50-50 indicators */}
                {item.rarity === 5 && item.isFeatured !== undefined && (
                  <div className="mt-2">
                    {item.isFeatured ? (
                      <span className="text-xs font-semibold px-2 py-1 bg-green-500 text-white rounded">
                        Featured
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-1 bg-red-500 text-white rounded">
                        Lost 50/50
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold ml-4">
                {item.rarity}★
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
