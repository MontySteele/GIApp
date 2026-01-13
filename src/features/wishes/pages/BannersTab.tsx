/**
 * BannersTab - Banner history and rerun tracking
 *
 * Shows historical banner data, character rerun history,
 * and predictions for upcoming reruns.
 */

import { useState, useMemo } from 'react';
import { Calendar, Clock, TrendingUp, Search, Star, History } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import {
  getCharactersByTimeSinceRun,
  getRecentBanners,
  getPotentialReruns,
  getCharacterBannerHistory,
  CURRENT_VERSION,
  type BannerRecord,
  type CharacterBannerHistory,
} from '@/lib/bannerHistory';

type ViewMode = 'timeline' | 'characters' | 'predictions';

export default function BannersTab() {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);

  // Get data based on view mode
  const recentBanners = useMemo(() => getRecentBanners(20), []);
  const characterHistory = useMemo(() => getCharactersByTimeSinceRun(), []);
  const potentialReruns = useMemo(() => getPotentialReruns(), []);

  // Filter characters by search
  const filteredCharacters = useMemo(() => {
    if (!searchQuery) return characterHistory;
    const query = searchQuery.toLowerCase();
    return characterHistory.filter((c) =>
      c.characterKey.toLowerCase().includes(query)
    );
  }, [characterHistory, searchQuery]);

  // Get selected character details
  const selectedCharacterHistory = useMemo(() => {
    if (!selectedCharacter) return null;
    return getCharacterBannerHistory(selectedCharacter);
  }, [selectedCharacter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-1">Banner History</h1>
        <p className="text-slate-400">
          Track character banners and plan your pulls around reruns
        </p>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-1 p-1 bg-slate-800 rounded-lg w-fit">
        <ViewTab
          icon={History}
          label="Timeline"
          active={viewMode === 'timeline'}
          onClick={() => setViewMode('timeline')}
        />
        <ViewTab
          icon={Star}
          label="Characters"
          active={viewMode === 'characters'}
          onClick={() => setViewMode('characters')}
        />
        <ViewTab
          icon={TrendingUp}
          label="Predictions"
          active={viewMode === 'predictions'}
          onClick={() => setViewMode('predictions')}
        />
      </div>

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Banners</h2>
            <span className="text-sm text-slate-400">Current: v{CURRENT_VERSION}</span>
          </div>

          <div className="space-y-3">
            {recentBanners.map((banner) => (
              <BannerCard
                key={banner.id}
                banner={banner}
                onCharacterClick={setSelectedCharacter}
              />
            ))}
          </div>
        </div>
      )}

      {/* Characters View */}
      {viewMode === 'characters' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search characters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Character List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCharacters.map((char) => (
              <CharacterHistoryCard
                key={char.characterKey}
                history={char}
                onClick={() => setSelectedCharacter(char.characterKey)}
                isSelected={selectedCharacter === char.characterKey}
              />
            ))}
          </div>
        </div>
      )}

      {/* Predictions View */}
      {viewMode === 'predictions' && (
        <div className="space-y-4">
          <Card className="p-4 border-amber-500/30 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-400">Prediction Disclaimer</h3>
                <p className="text-sm text-slate-400 mt-1">
                  These predictions are based on historical patterns and are not guarantees.
                  Mihoyo can run any character at any time regardless of rerun history.
                </p>
              </div>
            </div>
          </Card>

          <h2 className="text-lg font-semibold">Characters Overdue for Rerun</h2>
          <p className="text-sm text-slate-400">
            Characters who haven't appeared in 4+ versions (typically 6+ months)
          </p>

          <div className="space-y-3">
            {potentialReruns.length > 0 ? (
              potentialReruns.map((char) => (
                <PredictionCard
                  key={char.characterKey}
                  history={char}
                  onClick={() => {
                    setSelectedCharacter(char.characterKey);
                    setViewMode('characters');
                  }}
                />
              ))
            ) : (
              <Card className="p-8 text-center">
                <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">
                  No Overdue Characters
                </h3>
                <p className="text-slate-400">
                  All limited 5-star characters have had relatively recent reruns.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Character Detail Modal/Sidebar */}
      {selectedCharacterHistory && (
        <CharacterDetailPanel
          history={selectedCharacterHistory}
          onClose={() => setSelectedCharacter(null)}
        />
      )}
    </div>
  );
}

// Sub-components

function ViewTab({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Calendar;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'bg-primary-600 text-white'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
      }`}
      onClick={onClick}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function BannerCard({
  banner,
  onCharacterClick,
}: {
  banner: BannerRecord;
  onCharacterClick: (char: string) => void;
}) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">v{banner.version}</span>
            <span className="text-xs px-2 py-0.5 bg-slate-700 rounded">
              Phase {banner.phase}
            </span>
          </div>
          <div className="text-sm text-slate-400 mt-1">
            {formatDate(banner.startDate)} - {formatDate(banner.endDate)}
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Calendar className="w-3 h-3" />
          {banner.bannerType}
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <span className="text-xs text-amber-400 font-medium">Featured 5★</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {banner.featured5Star.map((char) => (
              <button
                key={char}
                onClick={() => onCharacterClick(char)}
                className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded text-sm hover:bg-amber-500/30 transition-colors"
              >
                {char}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="text-xs text-purple-400 font-medium">Featured 4★</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {banner.featured4Star.map((char) => (
              <span
                key={char}
                className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs"
              >
                {char}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function CharacterHistoryCard({
  history,
  onClick,
  isSelected,
}: {
  history: CharacterBannerHistory;
  onClick: () => void;
  isSelected: boolean;
}) {
  const statusColor =
    history.versionsSinceLastRun >= 6
      ? 'text-red-400'
      : history.versionsSinceLastRun >= 4
        ? 'text-amber-400'
        : 'text-green-400';

  return (
    <Card
      className={`p-3 cursor-pointer transition-colors ${
        isSelected ? 'border-primary-500' : 'hover:border-slate-600'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">{history.characterKey}</div>
          <div className="text-xs text-slate-400">
            {history.totalReruns} rerun{history.totalReruns !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-medium ${statusColor}`}>
            {history.versionsSinceLastRun > 0
              ? `${history.versionsSinceLastRun}v ago`
              : 'Current'}
          </div>
          {history.lastRun && (
            <div className="text-xs text-slate-500">
              {new Date(history.lastRun).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function PredictionCard({
  history,
  onClick,
}: {
  history: CharacterBannerHistory;
  onClick: () => void;
}) {
  return (
    <Card className="p-4 cursor-pointer hover:border-primary-500/50 transition-colors" onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="font-semibold">{history.characterKey}</div>
            <div className="text-sm text-slate-400">
              Last seen: {history.banners[0]?.version || 'Never'} ({history.banners[0]?.phase ? `Phase ${history.banners[0].phase}` : ''})
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-amber-400">
            {history.versionsSinceLastRun}v
          </div>
          <div className="text-xs text-slate-400">since last run</div>
        </div>
      </div>
    </Card>
  );
}

function CharacterDetailPanel({
  history,
  onClose,
}: {
  history: CharacterBannerHistory;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-slate-900 border-l border-slate-800 p-6 overflow-y-auto z-50 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">{history.characterKey}</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-amber-400">
            {history.totalReruns}
          </div>
          <div className="text-xs text-slate-400">Total Reruns</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-primary-400">
            {history.versionsSinceLastRun}v
          </div>
          <div className="text-xs text-slate-400">Since Last Run</div>
        </div>
      </div>

      {/* Banner History */}
      <h3 className="font-semibold mb-3">Banner History</h3>
      <div className="space-y-2">
        {history.banners.length > 0 ? (
          history.banners.map((banner, idx) => (
            <div
              key={`${banner.version}-${banner.phase}`}
              className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
            >
              <div>
                <div className="font-medium">
                  v{banner.version} Phase {banner.phase}
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(banner.date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
              {idx === 0 && (
                <span className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded text-xs">
                  Latest
                </span>
              )}
              {idx === history.banners.length - 1 && history.banners.length > 1 && (
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                  Debut
                </span>
              )}
            </div>
          ))
        ) : (
          <div className="text-slate-400 text-center py-4">
            No banner history recorded
          </div>
        )}
      </div>

      {/* Planning Tips */}
      <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          Planning Tips
        </h4>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>• Average rerun cycle: ~6 versions (1 year)</li>
          <li>• Popular characters may rerun more frequently</li>
          <li>• Anniversaries and festivals often feature reruns</li>
        </ul>
      </div>
    </div>
  );
}
