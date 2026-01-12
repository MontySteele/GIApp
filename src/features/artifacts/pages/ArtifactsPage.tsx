import { useState, useMemo } from 'react';
import { Trash2, Filter, Package, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { useArtifacts, type ArtifactFilters, type ArtifactSortField, type ArtifactWithScore } from '../hooks/useArtifacts';
import { formatArtifactSetName, formatSlotName, formatStatName } from '@/lib/gameData';
import { getGradeColor, getGradeBgColor } from '../domain/artifactScoring';
import { SLOT_NAMES } from '../domain/artifactConstants';

export default function ArtifactsPage() {
  const [filters, setFilters] = useState<ArtifactFilters>({});
  const [sortField, setSortField] = useState<ArtifactSortField>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'trash'>('all');

  const activeFilters = useMemo(() => ({
    ...filters,
    trashOnly: viewMode === 'trash',
  }), [filters, viewMode]);

  const { artifacts, isLoading, error, stats } = useArtifacts({
    filters: activeFilters,
    sort: { field: sortField, direction: sortDirection },
  });

  // Get unique set keys for filter dropdown
  const { allArtifacts } = useArtifacts();
  const setKeyOptions = useMemo(() => {
    const sets = new Set(allArtifacts.map((a) => a.setKey));
    return Array.from(sets).sort().map((key) => ({
      value: key,
      label: formatArtifactSetName(key),
    }));
  }, [allArtifacts]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading artifacts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-400 mb-2">Failed to load artifacts</p>
        <p className="text-slate-500 text-sm">{error}</p>
      </div>
    );
  }

  if (stats.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Package className="w-16 h-16 text-slate-600 mb-4" />
        <p className="text-slate-400 text-lg mb-2">No artifacts in inventory</p>
        <p className="text-slate-500 text-sm">
          Import your artifacts using Irminsul from the Roster page
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Artifact Inventory</h1>
          <p className="text-slate-400">
            {stats.total} artifacts • {stats.trash} flagged for strongbox
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-slate-400 mb-1">Total</div>
            <div className="text-2xl font-bold text-slate-100">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-slate-400 mb-1">5-Star</div>
            <div className="text-2xl font-bold text-yellow-400">{stats.fiveStar}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-slate-400 mb-1">Equipped</div>
            <div className="text-2xl font-bold text-blue-400">{stats.equipped}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-red-400 mb-1 flex items-center gap-1">
              <Trash2 className="w-3 h-3" />
              Strongbox Trash
            </div>
            <div className="text-2xl font-bold text-red-400">{stats.trash}</div>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold">Quality Distribution</h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            {(['S', 'A', 'B', 'C', 'D', 'F'] as const).map((grade) => (
              <div key={grade} className="flex items-center gap-2">
                <span
                  className={`w-8 h-8 flex items-center justify-center text-sm font-bold rounded border ${getGradeBgColor(grade)} ${getGradeColor(grade)}`}
                >
                  {grade}
                </span>
                <span className="text-slate-300">{stats.grades[grade]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* View Toggle & Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              viewMode === 'all'
                ? 'bg-slate-700 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Artifacts
          </button>
          <button
            onClick={() => setViewMode('trash')}
            className={`px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-1.5 ${
              viewMode === 'trash'
                ? 'bg-red-900/50 text-red-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Strongbox Trash
          </button>
        </div>

        <Button
          variant={showFilters ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4" />
          Filters
        </Button>

        <Select
          aria-label="Sort artifacts"
          value={sortField}
          onChange={(e) => setSortField(e.target.value as ArtifactSortField)}
          options={[
            { value: 'score', label: 'Score' },
            { value: 'critValue', label: 'Crit Value' },
            { value: 'level', label: 'Level' },
            { value: 'rarity', label: 'Rarity' },
          ]}
          className="w-36"
        />

        <button
          onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          className="px-2 py-1.5 bg-slate-800 rounded text-sm text-slate-400 hover:text-slate-200"
        >
          {sortDirection === 'desc' ? '↓ High to Low' : '↑ Low to High'}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Select
                aria-label="Filter by set"
                value={filters.setKey ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, setKey: e.target.value || undefined }))}
                options={[
                  { value: '', label: 'Any Set' },
                  ...setKeyOptions,
                ]}
              />
              <Select
                aria-label="Filter by slot"
                value={filters.slotKey ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, slotKey: e.target.value || undefined }))}
                options={[
                  { value: '', label: 'Any Slot' },
                  ...Object.entries(SLOT_NAMES).map(([key, label]) => ({ value: key, label })),
                ]}
              />
              <Select
                aria-label="Filter by rarity"
                value={filters.rarity?.toString() ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, rarity: e.target.value ? parseInt(e.target.value) : undefined }))}
                options={[
                  { value: '', label: 'Any Rarity' },
                  { value: '5', label: '5★' },
                  { value: '4', label: '4★' },
                  { value: '3', label: '3★' },
                ]}
              />
              <Select
                aria-label="Filter by equipped status"
                value={filters.equipped === undefined ? '' : filters.equipped ? 'equipped' : 'unequipped'}
                onChange={(e) => setFilters((f) => ({
                  ...f,
                  equipped: e.target.value === '' ? undefined : e.target.value === 'equipped',
                }))}
                options={[
                  { value: '', label: 'Any Status' },
                  { value: 'equipped', label: 'Equipped' },
                  { value: 'unequipped', label: 'Unequipped' },
                ]}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Artifact Grid */}
      {artifacts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400">No artifacts match your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {artifacts.map((artifact) => (
            <ArtifactCard key={artifact.id} artifact={artifact} />
          ))}
        </div>
      )}
    </div>
  );
}

function ArtifactCard({ artifact }: { artifact: ArtifactWithScore }) {
  const { score } = artifact;

  return (
    <Card className={score.isStrongboxTrash ? 'border-red-900/50' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-100 truncate text-sm">
              {formatArtifactSetName(artifact.setKey)}
            </h3>
            <p className="text-xs text-slate-400">
              {formatSlotName(artifact.slotKey)} • +{artifact.level}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant={artifact.rarity === 5 ? 'warning' : 'default'} className="text-xs">
              {artifact.rarity}★
            </Badge>
            <span
              className={`px-1.5 py-0.5 text-xs font-bold rounded border ${getGradeBgColor(score.grade)} ${getGradeColor(score.grade)}`}
            >
              {score.grade}
            </span>
          </div>
        </div>

        <div className="mb-2">
          <div className="text-xs text-slate-500">Main</div>
          <div className="text-sm text-slate-200">
            {formatStatName(artifact.mainStatKey)}
          </div>
        </div>

        {artifact.substats.length > 0 && (
          <div className="mb-2">
            <div className="text-xs text-slate-500 mb-1">Substats</div>
            <div className="space-y-0.5">
              {artifact.substats.map((sub, i) => {
                const isCrit = sub.key.toLowerCase().includes('crit');
                return (
                  <div key={i} className={`text-xs ${isCrit ? 'text-yellow-400' : 'text-slate-400'}`}>
                    {formatStatName(sub.key)}: {sub.value.toFixed(1)}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="text-xs text-slate-500">
            CV: <span className="text-slate-300">{score.critValue}</span>
          </div>
          {artifact.location ? (
            <div className="text-xs text-blue-400 truncate max-w-[100px]">
              {artifact.location}
            </div>
          ) : (
            <div className="text-xs text-slate-500">Unequipped</div>
          )}
        </div>

        {score.isStrongboxTrash && (
          <div className="mt-2 pt-2 border-t border-red-900/30">
            <div className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertTriangle className="w-3 h-3" />
              {score.trashReason}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
