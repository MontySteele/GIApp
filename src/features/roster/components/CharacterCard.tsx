import { Star, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { Character } from '@/types';

interface CharacterCardProps {
  character: Character;
  onClick?: () => void;
  onEdit?: (character: Character) => void;
  onDelete?: (character: Character) => void;
}

export default function CharacterCard({ character, onClick, onEdit, onDelete }: CharacterCardProps) {
  const priorityColors = {
    main: 'border-primary-500',
    secondary: 'border-blue-500',
    bench: 'border-slate-600',
    unbuilt: 'border-slate-700',
  };

  const priorityLabels = {
    main: 'Main',
    secondary: 'Secondary',
    bench: 'Bench',
    unbuilt: 'Unbuilt',
  };

  return (
    <Card
      className={`group cursor-pointer hover:border-primary-500 transition-colors border-2 ${priorityColors[character.priority]} relative`}
      onClick={onClick}
    >
      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(character);
            }}
            className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
            title="Edit character"
          >
            <Pencil className="w-3.5 h-3.5 text-slate-200" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(character);
            }}
            className="p-1.5 bg-red-700 hover:bg-red-600 rounded-md transition-colors"
            title="Delete character"
          >
            <Trash2 className="w-3.5 h-3.5 text-white" />
          </button>
        )}
      </div>

      <div className="p-4">
        {/* Character Name & Level */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 pr-2">
            <h3 className="font-semibold text-slate-100 mb-1">
              {character.key}
            </h3>
            <p className="text-sm text-slate-400">
              Lv. {character.level}/{character.ascension * 10 + 20}
            </p>
          </div>
          <Badge variant="default" className="text-xs">
            {priorityLabels[character.priority]}
          </Badge>
        </div>

        {/* Constellation */}
        <div className="flex items-center gap-1 mb-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${
                i < character.constellation
                  ? 'fill-rarity-5 text-rarity-5'
                  : 'text-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Talents */}
        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
          <div className="bg-slate-900 rounded px-2 py-1 text-center">
            <div className="text-slate-400">AA</div>
            <div className="text-slate-200 font-medium">{character.talent.auto}</div>
          </div>
          <div className="bg-slate-900 rounded px-2 py-1 text-center">
            <div className="text-slate-400">Skill</div>
            <div className="text-slate-200 font-medium">{character.talent.skill}</div>
          </div>
          <div className="bg-slate-900 rounded px-2 py-1 text-center">
            <div className="text-slate-400">Burst</div>
            <div className="text-slate-200 font-medium">{character.talent.burst}</div>
          </div>
        </div>

        {/* Weapon */}
        <div className="text-sm">
          <div className="text-slate-400 mb-1">Weapon</div>
          <div className="text-slate-200 font-medium">
            {character.weapon.key} R{character.weapon.refinement}
          </div>
          <div className="text-xs text-slate-400">
            Lv. {character.weapon.level}/{character.weapon.ascension * 10 + 20}
          </div>
        </div>
      </div>
    </Card>
  );
}
