import { Grid3x3, List, Filter } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { KNOWN_ELEMENTS, KNOWN_RARITIES, KNOWN_WEAPON_TYPES } from '../data/characterMetadata';
import type { CharacterPriority } from '@/types';
import type { CharacterSortField } from '../selectors/characterSelectors';

interface FilterState {
  element: string | null;
  weaponType: string | null;
  rarity: number | null;
  priority: CharacterPriority | null;
}

interface CharacterToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  sortField: CharacterSortField;
  onSortChange: (field: CharacterSortField) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  enableFilters?: boolean;
  enableSorting?: boolean;
}

const PRIORITY_OPTIONS = [
  { value: '', label: 'Any Priority' },
  { value: 'main', label: 'Main' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'bench', label: 'Bench' },
  { value: 'unbuilt', label: 'Unbuilt' },
];

export default function CharacterToolbar({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  sortField,
  onSortChange,
  viewMode,
  onViewModeChange,
  showFilters,
  onToggleFilters,
  enableFilters = true,
  enableSorting = true,
}: CharacterToolbarProps) {
  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search characters..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search characters"
          />
        </div>

        {/* Filters Toggle */}
        {enableFilters && (
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            onClick={onToggleFilters}
            aria-expanded={showFilters}
            aria-controls="character-filters"
          >
            <Filter className="w-4 h-4" aria-hidden="true" />
            Filters
          </Button>
        )}

        {enableSorting && (
          <Select
            aria-label="Sort characters"
            value={sortField}
            onChange={(e) => onSortChange(e.target.value as CharacterSortField)}
            options={[
              { value: 'name', label: 'Name (A-Z)' },
              { value: 'priority', label: 'Priority' },
              { value: 'level', label: 'Level (high to low)' },
            ]}
            className="w-48"
          />
        )}

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1" role="group" aria-label="View mode">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'grid'
                ? 'bg-slate-700 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
          >
            <Grid3x3 className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-slate-700 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
          >
            <List className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {enableFilters && showFilters && (
        <div id="character-filters" className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select
              aria-label="Filter by element"
              value={filters.element ?? ''}
              onChange={(e) =>
                onFiltersChange({ ...filters, element: e.target.value || null })
              }
              options={[
                { value: '', label: 'Any Element' },
                ...KNOWN_ELEMENTS.map((element) => ({ value: element, label: element })),
              ]}
            />
            <Select
              aria-label="Filter by weapon type"
              value={filters.weaponType ?? ''}
              onChange={(e) =>
                onFiltersChange({ ...filters, weaponType: e.target.value || null })
              }
              options={[
                { value: '', label: 'Any Weapon' },
                ...KNOWN_WEAPON_TYPES.map((weapon) => ({ value: weapon, label: weapon })),
              ]}
            />
            <Select
              aria-label="Filter by rarity"
              value={filters.rarity?.toString() ?? ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  rarity: e.target.value ? parseInt(e.target.value, 10) : null,
                })
              }
              options={[
                { value: '', label: 'Any Rarity' },
                ...KNOWN_RARITIES.map((rarity) => ({
                  value: rarity.toString(),
                  label: `${rarity}★`,
                })),
              ]}
            />
            <Select
              aria-label="Filter by priority"
              value={filters.priority ?? ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  priority: (e.target.value as CharacterPriority) || null,
                })
              }
              options={PRIORITY_OPTIONS}
            />
          </div>
        </div>
      )}
    </>
  );
}

export type { FilterState };
