import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import type { BuildTemplate, CharacterRole, BuildDifficulty, BuildBudget } from '@/types';

type FormData = Omit<BuildTemplate, 'id' | 'createdAt' | 'updatedAt'>;

interface BuildTemplateFormProps {
  template?: BuildTemplate;
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

export default function BuildTemplateForm({
  template,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Template Name"
        value={formData.name}
        onChange={(e) => updateField('name', e.target.value)}
        placeholder="e.g., Raiden National DPS"
        required
      />

      <Input
        label="Character Key"
        value={formData.characterKey}
        onChange={(e) => updateField('characterKey', e.target.value)}
        placeholder="e.g., RaidenShogun"
        required
      />

      <div className="grid grid-cols-3 gap-4">
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
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Brief description of this build..."
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          rows={3}
        />
      </div>

      <Input
        label="Primary Weapons (comma-separated)"
        value={formData.weapons.primary.join(', ')}
        onChange={(e) =>
          updateField('weapons', {
            ...formData.weapons,
            primary: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
          })
        }
        placeholder="e.g., EngulfingLightning, TheCatch"
      />

      <Input
        label="Alternative Weapons (comma-separated)"
        value={formData.weapons.alternatives.join(', ')}
        onChange={(e) =>
          updateField('weapons', {
            ...formData.weapons,
            alternatives: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
          })
        }
        placeholder="e.g., Deathmatch, FavoniusLance"
      />

      <Input
        label="Substat Priority (comma-separated)"
        value={formData.artifacts.substats.join(', ')}
        onChange={(e) =>
          updateField('artifacts', {
            ...formData.artifacts,
            substats: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
          })
        }
        placeholder="e.g., ER, Crit Rate, Crit DMG, ATK%"
      />

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

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSaving}>
          {isSaving ? 'Saving...' : template ? 'Save Changes' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
}
