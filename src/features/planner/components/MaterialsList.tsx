import MaterialItem from './MaterialItem';
import type { MaterialRequirement } from '../domain/ascensionCalculator';
import type { GroupedMaterials } from '../domain/multiCharacterCalculator';

// Category labels for grouped display
const CATEGORY_LABELS: Record<string, string> = {
  mora: 'Mora',
  exp: 'EXP Materials',
  boss: 'Boss Materials',
  gem: 'Elemental Gems',
  localSpecialty: 'Local Specialties',
  common: 'Common Materials',
  talent: 'Talent Books',
  weekly: 'Weekly Boss Materials',
  crown: 'Crowns',
};

interface MaterialsListProps {
  materials: MaterialRequirement[];
  onUpdateMaterial?: (key: string, count: number) => void;
}

/**
 * Flat list of materials for single character view
 */
export function MaterialsList({ materials, onUpdateMaterial }: MaterialsListProps) {
  return (
    <div className="space-y-3">
      {materials.map((mat) => (
        <MaterialItem
          key={`${mat.key}-${mat.tier || 0}`}
          mat={mat}
          onUpdateOwned={onUpdateMaterial}
        />
      ))}
    </div>
  );
}

interface GroupedMaterialsListProps {
  groupedMaterials: GroupedMaterials;
  onUpdateMaterial?: (key: string, count: number) => void;
}

/**
 * Grouped materials list for multi-character view
 */
export function GroupedMaterialsList({ groupedMaterials, onUpdateMaterial }: GroupedMaterialsListProps) {
  const categories = [
    'mora',
    'exp',
    'boss',
    'gem',
    'localSpecialty',
    'common',
    'talent',
    'weekly',
    'crown',
  ] as const;

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const materials = groupedMaterials[category];
        if (!materials || materials.length === 0) return null;

        return (
          <div key={category}>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
              {CATEGORY_LABELS[category] || category}
            </h3>
            <div className="space-y-2">
              {materials.map((mat) => (
                <MaterialItem
                  key={`${mat.key}-${mat.tier || 0}`}
                  mat={mat}
                  onUpdateOwned={onUpdateMaterial}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
