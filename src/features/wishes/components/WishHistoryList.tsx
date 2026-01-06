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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter((item) => new Date(item.time) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((item) => new Date(item.time) <= end);
    }

    // Sort by newest first
    filtered.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return filtered;
  }, [history, bannerFilter, rarityFilter, startDate, endDate]);

  // Paginate
  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedItems = filteredAndSorted.slice(startIndex, endIndex);

  // Get rarity color class
  const getRarityClass = (rarity: 3 | 4 | 5) => {
    switch (rarity) {
      case 5:
        return 'bg-amber-900/30 border-amber-500 text-amber-100';
      case 4:
        return 'bg-purple-900/30 border-purple-500 text-purple-100';
      case 3:
        return 'bg-blue-900/30 border-blue-500 text-blue-100';
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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="banner-filter" className="block text-sm font-medium text-slate-300 mb-1">
            Filter by Banner
          </label>
          <select
            id="banner-filter"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
          <label htmlFor="rarity-filter" className="block text-sm font-medium text-slate-300 mb-1">
            Filter by Rarity
          </label>
          <select
            id="rarity-filter"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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

        <div className="flex-1 min-w-[200px]">
          <label htmlFor="start-date" className="block text-sm font-medium text-slate-300 mb-1">
            Start Date
          </label>
          <input
            id="start-date"
            type="date"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <label htmlFor="end-date" className="block text-sm font-medium text-slate-300 mb-1">
            End Date
          </label>
          <input
            id="end-date"
            type="date"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Results info */}
      <div className="text-sm text-slate-400">
        Showing {filteredAndSorted.length} items
        {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
      </div>

      {/* Wish history list */}
      {filteredAndSorted.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          No wish history available. Import your wish history to get started.
        </div>
      ) : (
        <ul className="space-y-2">
          {paginatedItems.map((item) => (
          <li
            key={item.id}
            className={`p-4 border-2 rounded-lg ${getRarityClass(item.rarity)}`}
            role="listitem"
            data-rarity={item.rarity}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-semibold text-lg">{item.name}</div>
                <div className="text-sm text-slate-300 space-x-3 mt-1">
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
                      <span className="text-xs font-semibold px-2 py-1 bg-green-600 text-white rounded">
                        Featured
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-1 bg-red-600 text-white rounded">
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
      )}

      {/* Pagination */}
      {filteredAndSorted.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </button>
          <span className="px-4 py-2 text-slate-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
