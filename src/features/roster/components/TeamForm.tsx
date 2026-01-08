import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Save, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import type { Character, Team } from '@/types';
import { MAX_LEVEL_BY_ASCENSION } from '@/lib/constants';

interface TeamFormProps {
  characters: Character[];
  initialData?: Team;
  onSubmit: (team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

export default function TeamForm({ characters, initialData, onSubmit, onCancel }: TeamFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [rotationNotes, setRotationNotes] = useState(initialData?.rotationNotes ?? '');
  const [tagInput, setTagInput] = useState(initialData?.tags.join(', ') ?? '');
  const [selectedKeys, setSelectedKeys] = useState<string[]>(initialData?.characterKeys ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const sortedCharacters = useMemo(
    () => [...characters].sort((a, b) => a.key.localeCompare(b.key)),
    [characters]
  );

  const toggleCharacter = (key: string) => {
    setSelectedKeys((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      }

      if (prev.length >= 4) {
        setSelectionError('Teams are limited to four characters.');
        return prev;
      }

      setSelectionError(null);
      return [...prev, key];
    });
  };

  const moveCharacter = (key: string, direction: 'up' | 'down') => {
    setSelectedKeys((prev) => {
      const index = prev.indexOf(key);
      if (index === -1) return prev;

      const next = [...prev];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= next.length) return prev;

      const current = next[index];
      const swap = next[swapIndex];
      if (current !== undefined && swap !== undefined) {
        next[index] = swap;
        next[swapIndex] = current;
      }
      return next;
    });
  };

  const removeCharacter = (key: string) => {
    setSelectedKeys((prev) => prev.filter((k) => k !== key));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedKeys.length === 0) {
      setSelectionError('Select at least one character for this team.');
      return;
    }

    setIsSubmitting(true);

    try {
      const tags = tagInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      await onSubmit({
        name,
        characterKeys: selectedKeys,
        rotationNotes,
        tags,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-200">Team Overview</h3>
        <Input
          label="Team Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Hyperbloom Raiden"
          required
        />

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Tags
          </label>
          <Input
            placeholder="Comma separated e.g., abyss, bloom"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
          />
          <p className="text-xs text-slate-500 mt-1">
            Tags help you filter teams later. Separate multiple tags with commas.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Rotation Notes
          </label>
          <textarea
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
            rows={3}
            placeholder="Quick reminders for this team's rotation or role assignments."
            value={rotationNotes}
            onChange={(e) => setRotationNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-200">Assign Characters</h3>
            <p className="text-sm text-slate-400">
              Pick up to four characters and order them for rotations.
            </p>
          </div>
          <Badge variant="outline">{selectedKeys.length} selected</Badge>
        </div>

        {selectionError && <p className="text-sm text-red-400">{selectionError}</p>}

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 space-y-2 max-h-80 overflow-y-auto">
              {sortedCharacters.length === 0 ? (
                <p className="text-sm text-slate-400">Add characters to your roster to build teams.</p>
              ) : (
                sortedCharacters.map((character) => {
                  const isSelected = selectedKeys.includes(character.key);
                  return (
                    <label
                      key={character.id}
                      className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                        isSelected ? 'bg-primary-900/30 border border-primary-700' : 'hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-100">{character.key}</div>
                        <div className="text-xs text-slate-500">
                          Lv. {character.level}/{MAX_LEVEL_BY_ASCENSION[character.ascension] ?? 90} • {character.priority}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-primary-500 border-slate-600 rounded"
                        checked={isSelected}
                        onChange={() => toggleCharacter(character.key)}
                      />
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 space-y-2 max-h-80 overflow-y-auto">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-slate-200">Selected Order</h4>
                <span className="text-xs text-slate-500">Top = first slot</span>
              </div>

              {selectedKeys.length === 0 ? (
                <p className="text-sm text-slate-400">No characters selected.</p>
              ) : (
                selectedKeys.map((key, index) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
                  >
                    <div>
                      <div className="font-medium text-slate-100">{key}</div>
                      <div className="text-xs text-slate-500">Position {index + 1}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveCharacter(key, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40"
                        aria-label={`Move ${key} up`}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveCharacter(key, 'down')}
                        disabled={index === selectedKeys.length - 1}
                        className="p-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40"
                        aria-label={`Move ${key} down`}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCharacter(key)}
                        className="p-1 rounded bg-red-900/60 hover:bg-red-800"
                        aria-label={`Remove ${key}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          <X className="w-4 h-4" />
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          <Save className="w-4 h-4" />
          {initialData ? 'Update Team' : 'Create Team'}
        </Button>
      </div>
    </form>
  );
}
