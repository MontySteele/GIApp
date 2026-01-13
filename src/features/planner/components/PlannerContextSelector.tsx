/**
 * PlannerContextSelector - Select what to plan materials for
 *
 * Allows users to switch between:
 * - Single character selection
 * - Team selection (auto-selects all team members)
 * - All main priority characters
 * - Custom multi-select
 */

import { useMemo } from 'react';
import { User, Users, UsersRound, ListChecks } from 'lucide-react';
import type { Character, Team } from '@/types';

export type PlannerContext =
  | { type: 'character'; characterId: string }
  | { type: 'team'; teamId: string }
  | { type: 'priority'; priorityLevel: 'main' | 'all-priority' }
  | { type: 'custom'; characterIds: string[] };

interface PlannerContextSelectorProps {
  characters: Character[];
  teams: Team[];
  context: PlannerContext;
  onContextChange: (context: PlannerContext) => void;
  className?: string;
}

export default function PlannerContextSelector({
  characters,
  teams,
  context,
  onContextChange,
  className = '',
}: PlannerContextSelectorProps) {
  // Group characters by priority
  const mainCharacters = useMemo(
    () => characters.filter((c) => c.priority === 'main'),
    [characters]
  );
  const priorityCharacters = useMemo(
    () => characters.filter((c) => c.priority === 'main' || c.priority === 'secondary'),
    [characters]
  );

  // Get display label for current context
  const contextLabel = useMemo(() => {
    switch (context.type) {
      case 'character': {
        const char = characters.find((c) => c.id === context.characterId);
        return char ? char.key : 'Select character...';
      }
      case 'team': {
        const team = teams.find((t) => t.id === context.teamId);
        return team ? `Team: ${team.name}` : 'Select team...';
      }
      case 'priority':
        return context.priorityLevel === 'main'
          ? `Main Priority (${mainCharacters.length})`
          : `All Priority (${priorityCharacters.length})`;
      case 'custom':
        return `Custom (${context.characterIds.length} selected)`;
    }
  }, [context, characters, teams, mainCharacters.length, priorityCharacters.length]);

  // Get icon for current context
  const ContextIcon = useMemo(() => {
    switch (context.type) {
      case 'character':
        return User;
      case 'team':
        return UsersRound;
      case 'priority':
        return Users;
      case 'custom':
        return ListChecks;
    }
  }, [context.type]);

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="text-sm font-medium text-slate-300">Planning for</label>

      {/* Context Type Tabs */}
      <div className="flex gap-1 p-1 bg-slate-800 rounded-lg">
        <ContextTab
          icon={User}
          label="Character"
          active={context.type === 'character'}
          onClick={() =>
            onContextChange({
              type: 'character',
              characterId: characters[0]?.id || '',
            })
          }
        />
        <ContextTab
          icon={UsersRound}
          label="Team"
          active={context.type === 'team'}
          onClick={() =>
            onContextChange({
              type: 'team',
              teamId: teams[0]?.id || '',
            })
          }
          disabled={teams.length === 0}
        />
        <ContextTab
          icon={Users}
          label="Priority"
          active={context.type === 'priority'}
          onClick={() =>
            onContextChange({
              type: 'priority',
              priorityLevel: 'main',
            })
          }
        />
        <ContextTab
          icon={ListChecks}
          label="Custom"
          active={context.type === 'custom'}
          onClick={() =>
            onContextChange({
              type: 'custom',
              characterIds: [],
            })
          }
        />
      </div>

      {/* Context-specific selector */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700">
        {context.type === 'character' && (
          <CharacterSelector
            characters={characters}
            selectedId={context.characterId}
            onSelect={(id) => onContextChange({ type: 'character', characterId: id })}
          />
        )}

        {context.type === 'team' && (
          <TeamSelector
            teams={teams}
            characters={characters}
            selectedId={context.teamId}
            onSelect={(id) => onContextChange({ type: 'team', teamId: id })}
          />
        )}

        {context.type === 'priority' && (
          <PrioritySelector
            mainCount={mainCharacters.length}
            allPriorityCount={priorityCharacters.length}
            selected={context.priorityLevel}
            onSelect={(level) => onContextChange({ type: 'priority', priorityLevel: level })}
          />
        )}

        {context.type === 'custom' && (
          <CustomSelector
            characters={characters}
            selectedIds={context.characterIds}
            onSelect={(ids) => onContextChange({ type: 'custom', characterIds: ids })}
          />
        )}
      </div>

      {/* Selected summary */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <ContextIcon className="w-4 h-4" />
        <span>{contextLabel}</span>
      </div>
    </div>
  );
}

// Sub-components

function ContextTab({
  icon: Icon,
  label,
  active,
  onClick,
  disabled = false,
}: {
  icon: typeof User;
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
        active
          ? 'bg-primary-600 text-white'
          : disabled
            ? 'text-slate-600 cursor-not-allowed'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function CharacterSelector({
  characters,
  selectedId,
  onSelect,
}: {
  characters: Character[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="p-3">
      <select
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">Select a character...</option>
        {characters.map((char) => (
          <option key={char.id} value={char.id}>
            {char.key} (Lv. {char.level})
          </option>
        ))}
      </select>
    </div>
  );
}

function TeamSelector({
  teams,
  characters,
  selectedId,
  onSelect,
}: {
  teams: Team[];
  characters: Character[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const selectedTeam = teams.find((t) => t.id === selectedId);
  const teamMembers = selectedTeam?.characterKeys
    .map((key) => characters.find((c) => c.key === key))
    .filter(Boolean) as Character[];

  return (
    <div className="p-3 space-y-3">
      <select
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">Select a team...</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name} ({team.characterKeys.length} members)
          </option>
        ))}
      </select>

      {selectedTeam && teamMembers.length > 0 && (
        <div className="text-sm text-slate-400">
          <span className="font-medium">Members: </span>
          {teamMembers.map((m) => m.key).join(', ')}
        </div>
      )}

      {selectedTeam && teamMembers.length === 0 && (
        <div className="text-sm text-amber-400">
          No team members found in your roster. Add the characters first.
        </div>
      )}
    </div>
  );
}

function PrioritySelector({
  mainCount,
  allPriorityCount,
  selected,
  onSelect,
}: {
  mainCount: number;
  allPriorityCount: number;
  selected: 'main' | 'all-priority';
  onSelect: (level: 'main' | 'all-priority') => void;
}) {
  return (
    <div className="p-3 space-y-2">
      <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 cursor-pointer">
        <input
          type="radio"
          name="priority"
          checked={selected === 'main'}
          onChange={() => onSelect('main')}
          className="text-primary-500 focus:ring-primary-500"
        />
        <div>
          <div className="font-medium text-sm">Main Priority Only</div>
          <div className="text-xs text-slate-400">{mainCount} characters</div>
        </div>
      </label>
      <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 cursor-pointer">
        <input
          type="radio"
          name="priority"
          checked={selected === 'all-priority'}
          onChange={() => onSelect('all-priority')}
          className="text-primary-500 focus:ring-primary-500"
        />
        <div>
          <div className="font-medium text-sm">All Priority Characters</div>
          <div className="text-xs text-slate-400">
            {allPriorityCount} characters (Main + Secondary)
          </div>
        </div>
      </label>
    </div>
  );
}

function CustomSelector({
  characters,
  selectedIds,
  onSelect,
}: {
  characters: Character[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}) {
  const toggleCharacter = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelect(selectedIds.filter((i) => i !== id));
    } else {
      onSelect([...selectedIds, id]);
    }
  };

  const selectAll = () => onSelect(characters.map((c) => c.id));
  const deselectAll = () => onSelect([]);

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">
          {selectedIds.length} of {characters.length} selected
        </span>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="text-xs text-primary-400 hover:text-primary-300"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="text-xs text-slate-400 hover:text-slate-300"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="max-h-48 overflow-y-auto space-y-1">
        {characters.map((char) => (
          <label
            key={char.id}
            className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-700/50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(char.id)}
              onChange={() => toggleCharacter(char.id)}
              className="rounded text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm">{char.key}</span>
            <span className="text-xs text-slate-500">Lv. {char.level}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
