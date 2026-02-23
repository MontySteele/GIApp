import { useState, useMemo } from 'react';
import { Save, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { ALL_CHARACTERS } from '@/lib/constants/characterList';
import { WEAPONS } from '@/lib/data/equipmentData';
import type { Character, CharacterPriority } from '@/types';
import { characterSchema } from '@/lib/validation';

interface CharacterFormProps {
  onSubmit: (character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  initialData?: Character;
}

export default function CharacterForm({ onSubmit, onCancel, initialData }: CharacterFormProps) {
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    key: initialData?.key ?? '',
    level: initialData?.level ?? 1,
    ascension: initialData?.ascension ?? 0,
    constellation: initialData?.constellation ?? 0,
    talentAuto: initialData?.talent.auto ?? 1,
    talentSkill: initialData?.talent.skill ?? 1,
    talentBurst: initialData?.talent.burst ?? 1,
    weaponKey: initialData?.weapon.key ?? '',
    weaponLevel: initialData?.weapon.level ?? 1,
    weaponAscension: initialData?.weapon.ascension ?? 0,
    weaponRefinement: initialData?.weapon.refinement ?? 1,
    priority: initialData?.priority ?? 'unbuilt' as CharacterPriority,
    notes: initialData?.notes ?? '',
  });

  // Derive weapon type from selected character
  const selectedCharInfo = useMemo(
    () => ALL_CHARACTERS.find((c) => c.key.toLowerCase() === formData.key.toLowerCase() || c.name.toLowerCase() === formData.key.toLowerCase()),
    [formData.key],
  );

  const characterOptions = useMemo(
    () => ALL_CHARACTERS.map((c) => ({ value: c.key, label: c.name, sublabel: `${c.rarity}★ ${c.element} ${c.weapon}` })),
    [],
  );

  const weaponOptions = useMemo(() => {
    const filtered = selectedCharInfo
      ? WEAPONS.filter((w) => w.type === selectedCharInfo.weapon)
      : WEAPONS;
    return filtered.map((w) => ({ value: w.key, label: w.name, sublabel: `${w.rarity}★ ${w.type}` }));
  }, [selectedCharInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data with Zod
    const validation = characterSchema.safeParse(formData);
    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      for (const error of validation.error.issues) {
        const path = error.path.join('.');
        newErrors[path] = error.message;
      }
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        key: formData.key,
        level: formData.level,
        ascension: formData.ascension,
        constellation: formData.constellation,
        talent: {
          auto: formData.talentAuto,
          skill: formData.talentSkill,
          burst: formData.talentBurst,
        },
        weapon: {
          key: formData.weaponKey,
          level: formData.weaponLevel,
          ascension: formData.weaponAscension,
          refinement: formData.weaponRefinement,
        },
        artifacts: initialData?.artifacts ?? [],
        notes: formData.notes,
        priority: formData.priority,
        teamIds: initialData?.teamIds ?? [],
      });
    } catch (error) {
      console.error('Failed to save character:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-200">Basic Information</h3>

        <SearchableSelect
          label="Character Name"
          placeholder="Search characters..."
          options={characterOptions}
          value={formData.key}
          onChange={(val) => setFormData({ ...formData, key: val })}
          error={errors.key}
          allowFreeText
          disabled={isEditing}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Level"
            type="number"
            min="1"
            max="90"
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
            error={errors.level}
            required
          />

          <Select
            label="Ascension"
            value={formData.ascension.toString()}
            onChange={(e) => setFormData({ ...formData, ascension: parseInt(e.target.value) })}
            error={errors.ascension}
            options={[
              { value: '0', label: 'Ascension 0' },
              { value: '1', label: 'Ascension 1' },
              { value: '2', label: 'Ascension 2' },
              { value: '3', label: 'Ascension 3' },
              { value: '4', label: 'Ascension 4' },
              { value: '5', label: 'Ascension 5' },
              { value: '6', label: 'Ascension 6' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Constellation"
            value={formData.constellation.toString()}
            onChange={(e) => setFormData({ ...formData, constellation: parseInt(e.target.value) })}
            error={errors.constellation}
            options={[
              { value: '0', label: 'C0' },
              { value: '1', label: 'C1' },
              { value: '2', label: 'C2' },
              { value: '3', label: 'C3' },
              { value: '4', label: 'C4' },
              { value: '5', label: 'C5' },
              { value: '6', label: 'C6' },
            ]}
          />

          <Select
            label="Priority"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as CharacterPriority })}
            error={errors.priority}
            options={[
              { value: 'main', label: 'Main' },
              { value: 'secondary', label: 'Secondary' },
              { value: 'bench', label: 'Bench' },
              { value: 'unbuilt', label: 'Unbuilt' },
            ]}
          />
        </div>
      </div>

      {/* Talents */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-200">Talents</h3>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Normal Attack"
            type="number"
            min="1"
            max="15"
            value={formData.talentAuto}
            onChange={(e) => setFormData({ ...formData, talentAuto: parseInt(e.target.value) || 1 })}
            error={errors.talentAuto}
          />

          <Input
            label="Elemental Skill"
            type="number"
            min="1"
            max="15"
            value={formData.talentSkill}
            onChange={(e) => setFormData({ ...formData, talentSkill: parseInt(e.target.value) || 1 })}
            error={errors.talentSkill}
          />

          <Input
            label="Elemental Burst"
            type="number"
            min="1"
            max="15"
            value={formData.talentBurst}
            onChange={(e) => setFormData({ ...formData, talentBurst: parseInt(e.target.value) || 1 })}
            error={errors.talentBurst}
          />
        </div>
      </div>

      {/* Weapon */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-200">Weapon</h3>

        <SearchableSelect
          label="Weapon Name"
          placeholder={selectedCharInfo ? `Search ${selectedCharInfo.weapon}s...` : 'Search weapons...'}
          options={weaponOptions}
          value={formData.weaponKey}
          onChange={(val) => setFormData({ ...formData, weaponKey: val })}
          error={errors.weaponKey}
          allowFreeText
          required
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Level"
            type="number"
            min="1"
            max="90"
            value={formData.weaponLevel}
            onChange={(e) => setFormData({ ...formData, weaponLevel: parseInt(e.target.value) || 1 })}
            error={errors.weaponLevel}
          />

          <Select
            label="Ascension"
            value={formData.weaponAscension.toString()}
            onChange={(e) => setFormData({ ...formData, weaponAscension: parseInt(e.target.value) })}
            error={errors.weaponAscension}
            options={[
              { value: '0', label: 'Ascension 0' },
              { value: '1', label: 'Ascension 1' },
              { value: '2', label: 'Ascension 2' },
              { value: '3', label: 'Ascension 3' },
              { value: '4', label: 'Ascension 4' },
              { value: '5', label: 'Ascension 5' },
              { value: '6', label: 'Ascension 6' },
            ]}
          />

          <Select
            label="Refinement"
            value={formData.weaponRefinement.toString()}
            onChange={(e) => setFormData({ ...formData, weaponRefinement: parseInt(e.target.value) })}
            error={errors.weaponRefinement}
            options={[
              { value: '1', label: 'R1' },
              { value: '2', label: 'R2' },
              { value: '3', label: 'R3' },
              { value: '4', label: 'R4' },
              { value: '5', label: 'R5' },
            ]}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-200">Notes</h3>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Notes (optional)
          </label>
          <textarea
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
            rows={3}
            placeholder="Build notes, team synergies, etc."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          <X className="w-4 h-4" />
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          <Save className="w-4 h-4" />
          {initialData ? 'Update' : 'Add'} Character
        </Button>
      </div>
    </form>
  );
}
