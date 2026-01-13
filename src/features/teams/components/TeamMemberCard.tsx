import { useState } from 'react';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ApplyTemplateModal, BuildGapDisplay, useBuildTemplate } from '@/features/builds';
import type { Character, BuildTemplate } from '@/types';

interface TeamMemberCardProps {
  character: Character;
  position: number;
  appliedTemplateId?: string;
  onApplyTemplate?: (characterKey: string, template: BuildTemplate) => void;
}

export default function TeamMemberCard({
  character,
  position,
  appliedTemplateId,
  onApplyTemplate,
}: TeamMemberCardProps) {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const { template: appliedTemplate } = useBuildTemplate(appliedTemplateId || '');

  const handleApplyTemplate = (template: BuildTemplate) => {
    onApplyTemplate?.(character.key, template);
  };

  const talentString = `${character.talent.auto}/${character.talent.skill}/${character.talent.burst}`;

  return (
    <>
      <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-500 font-mono">#{position}</span>
                <Link
                  to={`/roster/${character.id}`}
                  className="font-semibold text-slate-200 hover:text-primary-400 transition-colors truncate"
                >
                  {character.key}
                </Link>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>Lv.{character.level}</span>
                <span className="text-slate-600">•</span>
                <span>C{character.constellation}</span>
                <span className="text-slate-600">•</span>
                <span className="font-mono">{talentString}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowApplyModal(true)}
                title="Apply build template"
              >
                <Layers className="w-4 h-4" />
              </Button>
              {appliedTemplate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  title={expanded ? 'Hide build gap' : 'Show build gap'}
                >
                  {expanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Weapon */}
          {character.weapon && (
            <div className="mt-2 text-xs text-slate-400">
              <span className="text-slate-500">Weapon:</span>{' '}
              <span className="text-slate-300">
                {character.weapon.key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className="text-slate-500 ml-1">
                R{character.weapon.refinement} Lv.{character.weapon.level}
              </span>
            </div>
          )}

          {/* Applied template badge */}
          {appliedTemplate && (
            <div className="mt-2 flex items-center gap-2">
              <Badge className="text-xs bg-primary-900/30 text-primary-300 border border-primary-700/50">
                Template: {appliedTemplate.name}
              </Badge>
            </div>
          )}
        </div>

        {/* Expanded build gap analysis */}
        {expanded && appliedTemplate && (
          <div className="border-t border-slate-700 p-3 bg-slate-900/50">
            <BuildGapDisplay
              character={character}
              template={appliedTemplate}
              compact
            />
          </div>
        )}
      </div>

      {/* Apply Template Modal */}
      <ApplyTemplateModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        character={character}
        onApply={handleApplyTemplate}
        currentTemplateId={appliedTemplateId}
      />
    </>
  );
}
