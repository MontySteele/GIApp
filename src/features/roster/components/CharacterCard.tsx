import { useState, useMemo } from 'react';
import { Star, Pencil, Trash2, User } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { Character, CharacterPriority } from '@/types';
import { getCharacterPortraitUrl, getCharacterPortraitUrlByKey } from '@/lib/gameData';
import { MAX_LEVEL_BY_ASCENSION } from '@/lib/constants';
import {
  calculateCharacterArtifactScore,
  getGradeColor,
  getGradeBgColor,
} from '@/features/artifacts/domain/artifactScoring';

interface CharacterCardProps {
  character: Character;
  onClick?: () => void;
  onEdit?: (character: Character) => void;
  onDelete?: (character: Character) => void;
  teamNames?: string[];
}

export default function CharacterCard({ character, onClick, onEdit, onDelete, teamNames }: CharacterCardProps) {
  const [imageError, setImageError] = useState(false);
  const portraitUrl = getCharacterPortraitUrl(character.avatarId) ?? getCharacterPortraitUrlByKey(character.key);

  // Calculate artifact score
  const artifactScore = useMemo(() => {
    if (character.artifacts.length === 0) return null;
    return calculateCharacterArtifactScore(character.artifacts);
  }, [character.artifacts]);

  const priorityColors: Record<CharacterPriority, string> = {
    main: 'border-primary-500',
    secondary: 'border-blue-500',
    bench: 'border-slate-600',
    unbuilt: 'border-slate-700',
  };

  const priorityLabels: Record<CharacterPriority, string> = {
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
            aria-label="Edit character"
          >
            <Pencil className="w-3.5 h-3.5 text-slate-200" aria-hidden="true" />
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
            aria-label="Delete character"
          >
            <Trash2 className="w-3.5 h-3.5 text-white" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="p-4">
        {/* Character Portrait & Name */}
        <div className="flex items-start gap-3 mb-3">
          {/* Portrait */}
          <div className="w-14 h-14 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
            {portraitUrl && !imageError ? (
              <img
                src={portraitUrl}
                alt={character.key}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
                loading="lazy"
              />
            ) : (
              <User className="w-8 h-8 text-slate-600" />
            )}
          </div>

          {/* Name & Level */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-slate-100 truncate">
                {character.key}
              </h3>
              <Badge variant="default" className="text-xs flex-shrink-0">
                {priorityLabels[character.priority]}
              </Badge>
            </div>
            <p className="text-sm text-slate-400">
              Lv. {character.level}/{MAX_LEVEL_BY_ASCENSION[character.ascension] ?? 90}
            </p>
          </div>
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
            Lv. {character.weapon.level}/{MAX_LEVEL_BY_ASCENSION[character.weapon.ascension] ?? 90}
          </div>
        </div>

        {/* Artifact Score */}
        {artifactScore && (
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-slate-400">Artifacts</div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                CV: {artifactScore.totalCritValue}
              </span>
              <span
                className={`px-1.5 py-0.5 text-xs font-bold rounded border ${getGradeBgColor(artifactScore.averageGrade)} ${getGradeColor(artifactScore.averageGrade)}`}
              >
                {artifactScore.averageGrade}
              </span>
            </div>
          </div>
        )}

        {teamNames && teamNames.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-slate-500 mb-1">Teams</div>
            <div className="flex flex-wrap gap-1">
              {teamNames.map((name) => (
                <Badge key={`${character.id}-${name}`} variant="outline" className="text-[11px]">
                  {name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
