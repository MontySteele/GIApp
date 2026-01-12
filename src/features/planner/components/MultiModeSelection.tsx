import { Users, Sword, Check } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import type { Character } from '@/types';
import type { GoalType } from '../hooks/useMultiCharacterPlan';
import type { WeaponGoalType } from '../hooks/useWeaponPlan';

type MultiTab = 'characters' | 'weapons';

interface EnrichedWeapon {
  id: string;
  key: string;
  level: number;
  displayName: string;
  displayRarity: number;
}

interface MultiModeSelectionProps {
  multiTab: MultiTab;
  onTabChange: (tab: MultiTab) => void;
  // Character props
  characters: Character[];
  selectedCharacterCount: number;
  characterGoalType: GoalType;
  onCharacterGoalTypeChange: (type: GoalType) => void;
  isCharacterSelected: (key: string) => boolean;
  onToggleCharacter: (key: string) => void;
  onSelectAllCharacters: () => void;
  onDeselectAllCharacters: () => void;
  // Weapon props
  weapons: EnrichedWeapon[];
  hasWeapons: boolean;
  selectedWeaponCount: number;
  weaponGoalType: WeaponGoalType;
  onWeaponGoalTypeChange: (type: WeaponGoalType) => void;
  isWeaponSelected: (key: string) => boolean;
  onToggleWeapon: (key: string) => void;
  onSelectAllWeapons: () => void;
  onDeselectAllWeapons: () => void;
}

export default function MultiModeSelection({
  multiTab,
  onTabChange,
  characters,
  selectedCharacterCount,
  characterGoalType,
  onCharacterGoalTypeChange,
  isCharacterSelected,
  onToggleCharacter,
  onSelectAllCharacters,
  onDeselectAllCharacters,
  weapons,
  hasWeapons,
  selectedWeaponCount,
  weaponGoalType,
  onWeaponGoalTypeChange,
  isWeaponSelected,
  onToggleWeapon,
  onSelectAllWeapons,
  onDeselectAllWeapons,
}: MultiModeSelectionProps) {
  // Sort characters alphabetically
  const sortedCharacters = [...characters].sort((a, b) => a.key.localeCompare(b.key));

  // Sort weapons by rarity then name
  const sortedWeapons = [...weapons]
    .filter((w) => w.displayRarity >= 4)
    .sort((a, b) => {
      if (a.displayRarity !== b.displayRarity) return b.displayRarity - a.displayRarity;
      return a.displayName.localeCompare(b.displayName);
    });

  return (
    <Card className="mb-6">
      <CardHeader>
        {/* Tab Switcher */}
        <div className="flex items-center gap-4 mb-2">
          <button
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              multiTab === 'characters'
                ? 'bg-primary-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => onTabChange('characters')}
          >
            <Users className="w-4 h-4" />
            Characters
            {selectedCharacterCount > 0 && (
              <Badge variant="primary" className="text-xs">{selectedCharacterCount}</Badge>
            )}
          </button>
          <button
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              multiTab === 'weapons'
                ? 'bg-primary-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => onTabChange('weapons')}
          >
            <Sword className="w-4 h-4" />
            Weapons
            {selectedWeaponCount > 0 && (
              <Badge variant="primary" className="text-xs">{selectedWeaponCount}</Badge>
            )}
          </button>
        </div>

        {/* Selection Controls */}
        <div className="flex items-center justify-end gap-2">
          <button
            className="text-xs text-primary-400 hover:text-primary-300"
            onClick={multiTab === 'characters' ? onSelectAllCharacters : onSelectAllWeapons}
          >
            Select All
          </button>
          <span className="text-slate-600">|</span>
          <button
            className="text-xs text-slate-400 hover:text-slate-300"
            onClick={multiTab === 'characters' ? onDeselectAllCharacters : onDeselectAllWeapons}
          >
            Clear
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Character Tab */}
        {multiTab === 'characters' && (
          <>
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">Goal for All Characters</label>
              <Select
                value={characterGoalType}
                onChange={(e) => onCharacterGoalTypeChange(e.target.value as GoalType)}
                options={[
                  { value: 'next', label: 'Next Ascension' },
                  { value: 'functional', label: 'Functional (80/1/6/6)' },
                  { value: 'comfortable', label: 'Comfortable (80/8/8/8)' },
                  { value: 'full', label: 'Full Build (90/10/10/10)' },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
              {sortedCharacters.map((character) => {
                const isSelected = isCharacterSelected(character.key);
                return (
                  <button
                    key={character.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-primary-900/30 border-primary-500 text-primary-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                    onClick={() => onToggleCharacter(character.key)}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected
                          ? 'bg-primary-500 border-primary-500'
                          : 'border-slate-500'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 text-left overflow-hidden">
                      <div className="text-sm font-medium truncate">{character.key}</div>
                      <div className="text-xs text-slate-500">Lv. {character.level}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Weapon Tab */}
        {multiTab === 'weapons' && (
          <>
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">Goal for All Weapons</label>
              <Select
                value={weaponGoalType}
                onChange={(e) => onWeaponGoalTypeChange(e.target.value as WeaponGoalType)}
                options={[
                  { value: 'next', label: 'Next Ascension' },
                  { value: 'comfortable', label: 'Level 80' },
                  { value: 'full', label: 'Level 90' },
                ]}
              />
            </div>

            {hasWeapons ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {sortedWeapons.map((weapon) => {
                  const isSelected = isWeaponSelected(weapon.key);
                  return (
                    <button
                      key={weapon.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                        isSelected
                          ? 'bg-primary-900/30 border-primary-500 text-primary-200'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                      onClick={() => onToggleWeapon(weapon.key)}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isSelected
                            ? 'bg-primary-500 border-primary-500'
                            : 'border-slate-500'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 text-left overflow-hidden">
                        <div className="text-sm font-medium truncate">{weapon.displayName}</div>
                        <div className="text-xs text-slate-500">
                          {weapon.displayRarity}★ Lv. {weapon.level}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Sword className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No weapons imported yet.</p>
                <p className="text-xs mt-1">Import weapons via Irminsul to plan weapon ascensions.</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
