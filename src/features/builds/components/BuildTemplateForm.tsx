import { useMemo, useState } from 'react';
import { ChevronDown, Plus, Search, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import type { BuildTemplate, CharacterRole, BuildDifficulty, BuildBudget, Character } from '@/types';
import {
  WEAPONS,
  ARTIFACT_SETS,
  MAIN_STATS_BY_SLOT,
  SUBSTATS,
  type WeaponData,
  type ArtifactSetData,
} from '@/lib/data/equipmentData';

type FormData = Omit<BuildTemplate, 'id' | 'createdAt' | 'updatedAt'>;

interface BuildTemplateFormProps {
  template?: BuildTemplate;
  characters?: Character[];
  onSave: (data: FormData) => Promise<void>;
  onCancel: () => void;
}

const INITIAL_FORM_DATA: FormData = {
  name: '',
  characterKey: '',
  description: '',
  role: 'dps',
  notes: '',
  weapons: {
    primary: [],
    alternatives: [],
  },
  artifacts: {
    sets: [],
    mainStats: {
      sands: [],
      goblet: [],
      circlet: [],
    },
    substats: [],
  },
  leveling: {
    talentPriority: ['burst', 'skill', 'auto'],
  },
  difficulty: 'intermediate',
  budget: 'mixed',
  source: '',
  isOfficial: false,
  tags: [],
  gameVersion: '',
};

// Searchable multi-select component for weapons
function WeaponSelector({
  label,
  selected,
  onChange,
}: {
  label: string;
  selected: string[];
  onChange: (weapons: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredWeapons = useMemo(() => {
    if (!search.trim()) return WEAPONS;
    const searchLower = search.toLowerCase();
    return WEAPONS.filter((w) => w.name.toLowerCase().includes(searchLower));
  }, [search]);

  const groupedWeapons = useMemo(() => {
    const groups: Record<string, WeaponData[]> = {};
    for (const weapon of filteredWeapons) {
      const key = `${weapon.rarity}★ ${weapon.type}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(weapon);
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredWeapons]);

  const toggleWeapon = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  const removeWeapon = (key: string) => {
    onChange(selected.filter((k) => k !== key));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300">{label}</label>

      {/* Selected weapons */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((key) => {
            const weapon = WEAPONS.find((w) => w.key === key);
            return (
              <Badge key={key} variant="secondary" className="flex items-center gap-1 pr-1">
                <span className="text-yellow-400 text-xs">{weapon?.rarity}★</span>
                {weapon?.name || key}
                <button
                  type="button"
                  onClick={() => removeWeapon(key)}
                  className="ml-1 p-0.5 hover:bg-slate-600 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add weapon...
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="border border-slate-700 rounded-lg bg-slate-800 shadow-lg">
          <div className="p-2 border-b border-slate-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search weapons..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-600 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto p-2 space-y-2">
            {groupedWeapons.map(([group, weapons]) => (
              <div key={group}>
                <div className="text-xs font-medium text-slate-500 mb-1">{group}</div>
                <div className="space-y-0.5">
                  {weapons.map((weapon) => (
                    <button
                      key={weapon.key}
                      type="button"
                      onClick={() => toggleWeapon(weapon.key)}
                      className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                        selected.includes(weapon.key)
                          ? 'bg-primary-900/50 text-primary-300'
                          : 'hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {weapon.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {groupedWeapons.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-2">No weapons found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Artifact set selector
function ArtifactSetSelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (sets: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredSets = useMemo(() => {
    if (!search.trim()) return ARTIFACT_SETS;
    const searchLower = search.toLowerCase();
    return ARTIFACT_SETS.filter((s) => s.name.toLowerCase().includes(searchLower));
  }, [search]);

  const toggleSet = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else if (selected.length < 3) {
      onChange([...selected, key]);
    }
  };

  const removeSet = (key: string) => {
    onChange(selected.filter((k) => k !== key));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300">
        Artifact Sets <span className="text-slate-500">(up to 3)</span>
      </label>

      {/* Selected sets */}
      {selected.length > 0 && (
        <div className="space-y-1.5">
          {selected.map((key) => {
            const set = ARTIFACT_SETS.find((s) => s.key === key);
            return (
              <div key={key} className="flex items-start gap-2 p-2 bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-200">{set?.name || key}</span>
                    <button
                      type="button"
                      onClick={() => removeSet(key)}
                      className="p-0.5 hover:bg-slate-600 rounded text-slate-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {set && (
                    <div className="text-xs text-slate-400 mt-0.5">
                      2pc: {set.twoPiece}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dropdown trigger */}
      {selected.length < 3 && (
        <>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add artifact set...
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="border border-slate-700 rounded-lg bg-slate-800 shadow-lg">
              <div className="p-2 border-b border-slate-700">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search artifact sets..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-600 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto p-2 space-y-0.5">
                {filteredSets.map((set) => (
                  <button
                    key={set.key}
                    type="button"
                    onClick={() => toggleSet(set.key)}
                    disabled={selected.includes(set.key)}
                    className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${
                      selected.includes(set.key)
                        ? 'bg-primary-900/50 text-primary-300'
                        : 'hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="font-medium">{set.name}</div>
                    <div className="text-xs text-slate-500">{set.twoPiece}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Multi-select for main stats
function MainStatSelector({
  slot,
  label,
  selected,
  onChange,
}: {
  slot: 'sands' | 'goblet' | 'circlet';
  label: string;
  selected: string[];
  onChange: (stats: string[]) => void;
}) {
  const options = MAIN_STATS_BY_SLOT[slot];

  const toggleStat = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-slate-400">{label}</label>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => toggleStat(option.key)}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              selected.includes(option.key)
                ? 'bg-primary-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Substat priority selector
function SubstatSelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (substats: string[]) => void;
}) {
  const toggleSubstat = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300">
        Substat Priority <span className="text-slate-500">(in order)</span>
      </label>
      <div className="flex flex-wrap gap-1.5">
        {SUBSTATS.map((substat) => (
          <button
            key={substat.key}
            type="button"
            onClick={() => toggleSubstat(substat.key)}
            className={`px-2.5 py-1 text-sm rounded transition-colors ${
              selected.includes(substat.key)
                ? 'bg-primary-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {selected.includes(substat.key) && (
              <span className="mr-1 text-xs opacity-70">
                {selected.indexOf(substat.key) + 1}.
              </span>
            )}
            {substat.label}
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-slate-500">
          Priority: {selected.map((k) => SUBSTATS.find((s) => s.key === k)?.label).join(' → ')}
        </p>
      )}
    </div>
  );
}

export default function BuildTemplateForm({
  template,
  characters = [],
  onSave,
  onCancel,
}: BuildTemplateFormProps) {
  const [formData, setFormData] = useState<FormData>(() => {
    if (template) {
      const { id, createdAt, updatedAt, ...rest } = template as BuildTemplate & { createdAt?: string; updatedAt?: string };
      return rest;
    }
    return INITIAL_FORM_DATA;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [characterSearch, setCharacterSearch] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Filter characters for dropdown
  const filteredCharacters = useMemo(() => {
    if (!characterSearch.trim()) return characters;
    const searchLower = characterSearch.toLowerCase();
    return characters.filter((c) => c.key.toLowerCase().includes(searchLower));
  }, [characters, characterSearch]);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Basic Info Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Basic Info</h4>

        <Input
          label="Template Name"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="e.g., Raiden National DPS"
          required
        />

        {/* Character selector */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300">Character</label>
          {characters.length > 0 ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search your roster..."
                value={characterSearch}
                onChange={(e) => setCharacterSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
              />
              {characterSearch && filteredCharacters.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredCharacters.map((char) => (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => {
                        updateField('characterKey', char.key);
                        setCharacterSearch('');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-700 text-sm text-slate-200"
                    >
                      {char.key}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Input
              value={formData.characterKey}
              onChange={(e) => updateField('characterKey', e.target.value)}
              placeholder="e.g., RaidenShogun"
              required
            />
          )}
          {formData.characterKey && (
            <Badge variant="primary" className="mt-1">
              {formData.characterKey}
              <button
                type="button"
                onClick={() => updateField('characterKey', '')}
                className="ml-1.5 hover:text-red-300"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Select
            label="Role"
            value={formData.role}
            onChange={(e) => updateField('role', e.target.value as CharacterRole)}
            options={[
              { value: 'dps', label: 'DPS' },
              { value: 'sub-dps', label: 'Sub-DPS' },
              { value: 'support', label: 'Support' },
              { value: 'healer', label: 'Healer' },
              { value: 'shielder', label: 'Shielder' },
            ]}
          />
          <Select
            label="Difficulty"
            value={formData.difficulty}
            onChange={(e) => updateField('difficulty', e.target.value as BuildDifficulty)}
            options={[
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
            ]}
          />
          <Select
            label="Budget"
            value={formData.budget}
            onChange={(e) => updateField('budget', e.target.value as BuildBudget)}
            options={[
              { value: 'f2p', label: 'F2P' },
              { value: '4-star', label: '4-Star' },
              { value: 'mixed', label: 'Mixed' },
              { value: 'whale', label: 'Whale' },
            ]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Brief description of this build..."
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm"
            rows={2}
          />
        </div>
      </div>

      {/* Weapons Section */}
      <div className="space-y-4 pt-4 border-t border-slate-700">
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Weapons</h4>

        <WeaponSelector
          label="Primary Weapons"
          selected={formData.weapons.primary}
          onChange={(weapons) =>
            updateField('weapons', { ...formData.weapons, primary: weapons })
          }
        />

        <WeaponSelector
          label="Alternative Weapons"
          selected={formData.weapons.alternatives}
          onChange={(weapons) =>
            updateField('weapons', { ...formData.weapons, alternatives: weapons })
          }
        />
      </div>

      {/* Artifacts Section */}
      <div className="space-y-4 pt-4 border-t border-slate-700">
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Artifacts</h4>

        <ArtifactSetSelector
          selected={formData.artifacts.sets}
          onChange={(sets) =>
            updateField('artifacts', { ...formData.artifacts, sets })
          }
        />

        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-300">Main Stats</label>
          <div className="grid grid-cols-3 gap-3">
            <MainStatSelector
              slot="sands"
              label="Sands"
              selected={formData.artifacts.mainStats.sands}
              onChange={(stats) =>
                updateField('artifacts', {
                  ...formData.artifacts,
                  mainStats: { ...formData.artifacts.mainStats, sands: stats },
                })
              }
            />
            <MainStatSelector
              slot="goblet"
              label="Goblet"
              selected={formData.artifacts.mainStats.goblet}
              onChange={(stats) =>
                updateField('artifacts', {
                  ...formData.artifacts,
                  mainStats: { ...formData.artifacts.mainStats, goblet: stats },
                })
              }
            />
            <MainStatSelector
              slot="circlet"
              label="Circlet"
              selected={formData.artifacts.mainStats.circlet}
              onChange={(stats) =>
                updateField('artifacts', {
                  ...formData.artifacts,
                  mainStats: { ...formData.artifacts.mainStats, circlet: stats },
                })
              }
            />
          </div>
        </div>

        <SubstatSelector
          selected={formData.artifacts.substats}
          onChange={(substats) =>
            updateField('artifacts', { ...formData.artifacts, substats })
          }
        />
      </div>

      {/* Tags & Options */}
      <div className="space-y-4 pt-4 border-t border-slate-700">
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Options</h4>

        <Input
          label="Tags (comma-separated)"
          value={formData.tags.join(', ')}
          onChange={(e) =>
            updateField('tags', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))
          }
          placeholder="e.g., meta, national, quickswap"
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isOfficial"
            checked={formData.isOfficial}
            onChange={(e) => updateField('isOfficial', e.target.checked)}
            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-primary-500"
          />
          <label htmlFor="isOfficial" className="text-sm text-slate-300">
            Official/Curated Build
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSaving || !formData.characterKey}>
          {isSaving ? 'Saving...' : template ? 'Save Changes' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
}
