import { useState, useMemo } from 'react';
import { Heart, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { ALL_CHARACTERS } from '@/lib/constants/characterList';
import { useWishlistStore, type WishlistCharacter } from '@/stores/wishlistStore';

const GOAL_CYCLE: WishlistCharacter['targetGoal'][] = ['functional', 'comfortable', 'full'];
const GOAL_LABELS: Record<string, string> = {
  functional: 'Functional',
  comfortable: 'Comfortable',
  full: 'Full Build',
};

interface RosterWishlistProps {
  ownedKeys: string[];
}

export default function RosterWishlist({ ownedKeys }: RosterWishlistProps) {
  const characters = useWishlistStore((s) => s.characters);
  const addCharacter = useWishlistStore((s) => s.addCharacter);
  const removeCharacter = useWishlistStore((s) => s.removeCharacter);
  const updateCharacter = useWishlistStore((s) => s.updateCharacter);

  const [isExpanded, setIsExpanded] = useState(characters.length > 0);
  const [addQuery, setAddQuery] = useState('');

  const ownedSet = useMemo(
    () => new Set(ownedKeys.map((k) => k.toLowerCase())),
    [ownedKeys],
  );

  const wishlistedSet = useMemo(
    () => new Set(characters.map((c) => c.key.toLowerCase())),
    [characters],
  );

  const availableOptions = useMemo(
    () =>
      ALL_CHARACTERS
        .filter((c) => !ownedSet.has(c.key.toLowerCase()) && !wishlistedSet.has(c.key.toLowerCase()))
        .map((c) => ({ value: c.key, label: c.name, sublabel: `${c.rarity}★ ${c.element} ${c.weapon}` })),
    [ownedSet, wishlistedSet],
  );

  const handleAdd = (key: string) => {
    if (key && !ownedSet.has(key.toLowerCase()) && !wishlistedSet.has(key.toLowerCase())) {
      addCharacter(key);
      setAddQuery('');
    }
  };

  const cycleGoal = (key: string, current: WishlistCharacter['targetGoal']) => {
    const idx = GOAL_CYCLE.indexOf(current);
    const next = GOAL_CYCLE[(idx + 1) % GOAL_CYCLE.length];
    updateCharacter(key, { targetGoal: next });
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-lg font-semibold text-slate-200 hover:text-slate-100 transition-colors mb-3 w-full"
      >
        <Heart className="w-5 h-5 text-pink-400" />
        <span>Wishlist</span>
        {characters.length > 0 && (
          <Badge variant="default" className="ml-1">{characters.length}</Badge>
        )}
        <span className="ml-auto">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {isExpanded && (
        <div className="space-y-3">
          {/* Add character picker */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <SearchableSelect
                placeholder="Add character to wishlist..."
                options={availableOptions}
                value={addQuery}
                onChange={handleAdd}
              />
            </div>
          </div>

          {/* Wishlist cards */}
          {characters.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">
              No characters wishlisted. Add characters you want to pre-farm for.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {characters.map((wc) => {
                const charInfo = ALL_CHARACTERS.find(
                  (c) => c.key.toLowerCase() === wc.key.toLowerCase(),
                );
                return (
                  <div
                    key={wc.key}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-pink-400" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-200 truncate">
                          {charInfo?.name ?? wc.key}
                        </div>
                        {charInfo && (
                          <div className="text-xs text-slate-500">
                            {charInfo.rarity}★ {charInfo.element}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <button
                        onClick={() => cycleGoal(wc.key, wc.targetGoal)}
                        className="px-2 py-0.5 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                        title="Click to cycle goal"
                      >
                        {GOAL_LABELS[wc.targetGoal]}
                      </button>
                      <button
                        onClick={() => removeCharacter(wc.key)}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                        aria-label={`Remove ${wc.key} from wishlist`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
