/**
 * Wishlist Section for Material Planner
 *
 * Allows users to add characters they want to pre-farm for (but don't own yet)
 */

import { useState, useMemo } from 'react';
import { Plus, X, Search, Star, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { useWishlistStore, type WishlistCharacter } from '@/stores/wishlistStore';
import { ALL_CHARACTERS, searchCharacters, type CharacterInfo } from '@/lib/constants/characterList';

const ELEMENT_COLORS: Record<string, string> = {
  Pyro: 'text-red-400 bg-red-900/30',
  Hydro: 'text-blue-400 bg-blue-900/30',
  Anemo: 'text-teal-400 bg-teal-900/30',
  Electro: 'text-purple-400 bg-purple-900/30',
  Dendro: 'text-green-400 bg-green-900/30',
  Cryo: 'text-cyan-400 bg-cyan-900/30',
  Geo: 'text-yellow-400 bg-yellow-900/30',
};

interface WishlistSectionProps {
  /** Keys of characters already owned */
  ownedCharacterKeys: string[];
}

export default function WishlistSection({ ownedCharacterKeys }: WishlistSectionProps) {
  const {
    characters: wishlistCharacters,
    addCharacter,
    removeCharacter,
    updateCharacter,
    isWishlisted,
  } = useWishlistStore();

  const wishlistCount = wishlistCharacters.length;

  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterInfo | null>(null);
  const [targetGoal, setTargetGoal] = useState<WishlistCharacter['targetGoal']>('comfortable');

  // Filter out owned characters and already wishlisted
  const ownedSet = useMemo(() => new Set(ownedCharacterKeys.map((k) => k.toLowerCase())), [ownedCharacterKeys]);

  const availableCharacters = useMemo(() => {
    if (!searchQuery.trim()) {
      return ALL_CHARACTERS.filter(
        (c) => !ownedSet.has(c.key.toLowerCase()) && !isWishlisted(c.key)
      ).slice(0, 10);
    }

    return searchCharacters(searchQuery).filter(
      (c) => !ownedSet.has(c.key.toLowerCase()) && !isWishlisted(c.key)
    );
  }, [searchQuery, ownedSet, isWishlisted]);

  const handleAddCharacter = () => {
    if (selectedCharacter) {
      addCharacter(selectedCharacter.key, targetGoal);
      setSelectedCharacter(null);
      setSearchQuery('');
      setShowAddForm(false);
    }
  };

  const handleRemoveCharacter = (key: string) => {
    removeCharacter(key);
  };

  const handleUpdateGoal = (key: string, newGoal: WishlistCharacter['targetGoal']) => {
    updateCharacter(key, { targetGoal: newGoal });
  };

  const getCharacterInfo = (key: string): CharacterInfo | undefined => {
    return ALL_CHARACTERS.find((c) => c.key === key);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Wishlist
            {wishlistCount > 0 && (
              <span className="text-sm text-slate-400 font-normal">
                ({wishlistCount} character{wishlistCount !== 1 ? 's' : ''})
              </span>
            )}
          </h2>
          {!showAddForm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="w-4 h-4" />
              Add Character
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Add Character Form */}
        {showAddForm && (
          <div className="mb-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-medium text-slate-200">Add to Wishlist</h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setSearchQuery('');
                  setSelectedCharacter(null);
                }}
                className="ml-auto text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search characters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Character List */}
            {!selectedCharacter && (
              <div className="max-h-48 overflow-y-auto space-y-1 mb-3">
                {availableCharacters.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    {searchQuery ? 'No matching characters found' : 'All characters are owned or wishlisted'}
                  </p>
                ) : (
                  availableCharacters.map((char) => (
                    <button
                      key={char.key}
                      onClick={() => setSelectedCharacter(char)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700 transition-colors text-left"
                    >
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${ELEMENT_COLORS[char.element]}`}>
                        {char.element}
                      </span>
                      <span className="text-slate-200">{char.name}</span>
                      <span className="ml-auto text-xs text-slate-500">
                        {char.rarity}★ {char.weapon}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Selected Character */}
            {selectedCharacter && (
              <div className="mb-3">
                <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg border border-primary-500/30">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${ELEMENT_COLORS[selectedCharacter.element]}`}>
                    {selectedCharacter.element}
                  </span>
                  <span className="text-slate-200 font-medium">{selectedCharacter.name}</span>
                  <span className="text-xs text-slate-500">
                    {selectedCharacter.rarity}★ {selectedCharacter.weapon}
                  </span>
                  <button
                    onClick={() => setSelectedCharacter(null)}
                    className="ml-auto text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Goal Selection */}
            {selectedCharacter && (
              <div className="mb-3">
                <label className="block text-sm text-slate-400 mb-2">Target Build</label>
                <Select
                  value={targetGoal}
                  onChange={(e) => setTargetGoal(e.target.value as WishlistCharacter['targetGoal'])}
                  options={[
                    { value: 'functional', label: 'Functional (80/1/6/6)' },
                    { value: 'comfortable', label: 'Comfortable (80/8/8/8)' },
                    { value: 'full', label: 'Full Build (90/10/10/10)' },
                  ]}
                />
              </div>
            )}

            {/* Add Button */}
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setSearchQuery('');
                  setSelectedCharacter(null);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!selectedCharacter}
                onClick={handleAddCharacter}
              >
                Add to Wishlist
              </Button>
            </div>
          </div>
        )}

        {/* Wishlist Characters */}
        {wishlistCount === 0 && !showAddForm ? (
          <p className="text-sm text-slate-500 text-center py-4">
            Add characters you want to pre-farm for (before pulling them)
          </p>
        ) : (
          <div className="space-y-2">
            {wishlistCharacters.map((wc) => {
              const charInfo = getCharacterInfo(wc.key);
              if (!charInfo) return null;

              return (
                <div
                  key={wc.key}
                  className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg"
                >
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${ELEMENT_COLORS[charInfo.element]}`}>
                    {charInfo.element}
                  </span>
                  <span className="text-slate-200">{charInfo.name}</span>
                  <div className="ml-auto flex items-center gap-2">
                    <Select
                      value={wc.targetGoal}
                      onChange={(e) => handleUpdateGoal(wc.key, e.target.value as WishlistCharacter['targetGoal'])}
                      className="w-36 text-sm"
                      options={[
                        { value: 'functional', label: 'Functional' },
                        { value: 'comfortable', label: 'Comfortable' },
                        { value: 'full', label: 'Full Build' },
                      ]}
                    />
                    <button
                      onClick={() => handleRemoveCharacter(wc.key)}
                      className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
