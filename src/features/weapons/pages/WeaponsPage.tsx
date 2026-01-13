import { useState, useMemo } from 'react';
import { Sword, Filter, Search, ChevronDown, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import { CardSkeleton, StatCardSkeleton } from '@/components/ui/Skeleton';
import {
  useWeapons,
  filterAndSortWeapons,
  type WeaponFilters,
  type WeaponSortKey,
  type EnrichedWeapon,
} from '../hooks/useWeapons';
import {
  WEAPON_TYPE_NAMES,
  RARITY_COLORS,
  RARITY_BG_COLORS,
  getRefinementDisplay,
  getRefinementColor,
  type WeaponType,
} from '../domain/weaponConstants';

export default function WeaponsPage() {
  const { weapons, isLoading, stats, hasWeapons } = useWeapons();

  const [filters, setFilters] = useState<WeaponFilters>({
    type: 'all',
    rarity: 'all',
    equipped: 'all',
    search: '',
  });
  const [sortKey, setSortKey] = useState<WeaponSortKey>('rarity');
  const sortDirection = 'desc'; // Fixed to descending
  const [showFilters, setShowFilters] = useState(false);

  const filteredWeapons = useMemo(
    () => filterAndSortWeapons(weapons, filters, sortKey, sortDirection),
    [weapons, filters, sortKey, sortDirection]
  );

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-slate-700 rounded animate-pulse" />
          <div className="h-6 w-24 bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!hasWeapons) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold text-slate-100">Weapons</h1>
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <Sword className="w-16 h-16 mx-auto text-slate-600" />
              <div>
                <p className="text-slate-300">No weapons in inventory</p>
                <p className="text-sm text-slate-500 mt-2">
                  Import your data from Irminsul or GOOD format to see your weapon collection.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Weapons</h1>
        <Badge variant="default">{stats.total} weapons</Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="5-Star" value={stats.fiveStars} color="text-yellow-400" />
        <StatCard label="4-Star" value={stats.fourStars} color="text-purple-400" />
        <StatCard label="Max Refinement" value={stats.maxRefinement} color="text-green-400" />
        <StatCard label="Equipped" value={stats.equipped} color="text-blue-400" />
      </div>

      {/* By Type */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-3">
            {(Object.entries(stats.byType) as [WeaponType, number][]).map(([type, count]) => (
              <div key={type} className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">{WEAPON_TYPE_NAMES[type]}:</span>
                <span className="text-slate-200 font-medium">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-3 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search weapons or characters..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Select
                label="Type"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value as WeaponType | 'all' })}
                options={[
                  { value: 'all', label: 'All Types' },
                  { value: 'sword', label: 'Sword' },
                  { value: 'claymore', label: 'Claymore' },
                  { value: 'polearm', label: 'Polearm' },
                  { value: 'bow', label: 'Bow' },
                  { value: 'catalyst', label: 'Catalyst' },
                ]}
              />

              <Select
                label="Rarity"
                value={filters.rarity === 'all' ? 'all' : String(filters.rarity)}
                onChange={(e) =>
                  setFilters({ ...filters, rarity: e.target.value === 'all' ? 'all' : Number(e.target.value) })
                }
                options={[
                  { value: 'all', label: 'All Rarities' },
                  { value: '5', label: '5-Star' },
                  { value: '4', label: '4-Star' },
                  { value: '3', label: '3-Star' },
                ]}
              />

              <Select
                label="Status"
                value={filters.equipped}
                onChange={(e) => setFilters({ ...filters, equipped: e.target.value as 'all' | 'equipped' | 'unequipped' })}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'equipped', label: 'Equipped' },
                  { value: 'unequipped', label: 'Unequipped' },
                ]}
              />

              <Select
                label="Sort By"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as WeaponSortKey)}
                options={[
                  { value: 'rarity', label: 'Rarity' },
                  { value: 'level', label: 'Level' },
                  { value: 'refinement', label: 'Refinement' },
                  { value: 'name', label: 'Name' },
                  { value: 'type', label: 'Type' },
                ]}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-slate-500">
        Showing {filteredWeapons.length} of {weapons.length} weapons
      </div>

      {/* Weapons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredWeapons.map((weapon) => (
          <WeaponCard key={weapon.id} weapon={weapon} />
        ))}
      </div>

      {filteredWeapons.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-slate-400">
            No weapons match your filters
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-3 text-center">
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </CardContent>
    </Card>
  );
}

function WeaponCard({ weapon }: { weapon: EnrichedWeapon }) {
  const rarityColor = RARITY_COLORS[weapon.displayRarity] || 'text-slate-400';
  const rarityBg = RARITY_BG_COLORS[weapon.displayRarity] || 'bg-slate-800 border-slate-700';
  const refinementColor = getRefinementColor(weapon.refinement);

  return (
    <Card className={`${rarityBg} border`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Weapon Name */}
            <h3 className={`font-semibold truncate ${rarityColor}`}>{weapon.displayName}</h3>

            {/* Type and Rarity */}
            <div className="flex items-center gap-2 mt-1">
              {weapon.weaponType && (
                <span className="text-xs text-slate-500">{WEAPON_TYPE_NAMES[weapon.weaponType]}</span>
              )}
              <span className={`text-xs ${rarityColor}`}>{'★'.repeat(weapon.displayRarity)}</span>
            </div>

            {/* Level and Refinement */}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-slate-300">
                Lv. {weapon.level}
                <span className="text-slate-500">/</span>
                {[20, 40, 50, 60, 70, 80, 90][weapon.ascension]}
              </span>
              <span className={`text-sm font-medium ${refinementColor}`}>
                {getRefinementDisplay(weapon.refinement)}
              </span>
            </div>

            {/* Equipped */}
            {weapon.location && (
              <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                <User className="w-3 h-3" />
                <span className="truncate">{weapon.location}</span>
              </div>
            )}
          </div>

          {/* Ascension Badge */}
          <div className="flex flex-col items-end gap-1">
            <Badge variant="default" className="text-xs">
              A{weapon.ascension}
            </Badge>
            {weapon.lock && (
              <Badge variant="default" className="text-xs">
                Locked
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
