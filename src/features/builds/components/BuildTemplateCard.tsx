import { Trash2, Edit2, Star, Zap, Shield, Heart, Swords } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { BuildTemplate, CharacterRole } from '@/types';

interface BuildTemplateCardProps {
  template: BuildTemplate;
  onEdit?: (template: BuildTemplate) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

const roleIcons: Record<CharacterRole, typeof Swords> = {
  dps: Swords,
  'sub-dps': Zap,
  support: Star,
  healer: Heart,
  shielder: Shield,
};

const roleColors: Record<CharacterRole, string> = {
  dps: 'bg-red-900/30 text-red-300 border-red-700',
  'sub-dps': 'bg-orange-900/30 text-orange-300 border-orange-700',
  support: 'bg-blue-900/30 text-blue-300 border-blue-700',
  healer: 'bg-green-900/30 text-green-300 border-green-700',
  shielder: 'bg-yellow-900/30 text-yellow-300 border-yellow-700',
};

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-900/30 text-green-300',
  intermediate: 'bg-yellow-900/30 text-yellow-300',
  advanced: 'bg-red-900/30 text-red-300',
};

const budgetColors: Record<string, string> = {
  f2p: 'bg-emerald-900/30 text-emerald-300',
  '4-star': 'bg-purple-900/30 text-purple-300',
  mixed: 'bg-blue-900/30 text-blue-300',
  whale: 'bg-amber-900/30 text-amber-300',
};

export default function BuildTemplateCard({
  template,
  onEdit,
  onDelete,
  compact = false,
}: BuildTemplateCardProps) {
  const RoleIcon = roleIcons[template.role];

  return (
    <Card className={compact ? 'p-3' : ''}>
      <CardHeader className={compact ? 'pb-2' : ''}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-100 truncate">{template.name}</h3>
              {template.isOfficial && (
                <Badge className="bg-primary-900/30 text-primary-300 text-xs">Official</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>{template.characterKey}</span>
              <span className="text-slate-600">|</span>
              <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${roleColors[template.role]}`}>
                <RoleIcon className="w-3 h-3" />
                {template.role}
              </span>
            </div>
          </div>
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {onEdit && (
                <button
                  onClick={() => onEdit(template)}
                  className="p-1.5 text-slate-400 hover:text-primary-400 transition-colors"
                  title="Edit"
                  aria-label="Edit template"
                >
                  <Edit2 className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(template.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                  title="Delete"
                  aria-label="Delete template"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className={compact ? 'pt-0' : ''}>
        {!compact && template.description && (
          <p className="text-sm text-slate-400 mb-3 line-clamp-2">{template.description}</p>
        )}

        {/* Weapons */}
        <div className="mb-3">
          <div className="text-xs text-slate-500 mb-1">Weapons</div>
          <div className="flex flex-wrap gap-1">
            {template.weapons.primary.slice(0, 3).map((weapon) => (
              <Badge key={weapon} className="text-xs bg-slate-700 text-slate-200">
                {weapon.replace(/([A-Z])/g, ' $1').trim()}
              </Badge>
            ))}
            {template.weapons.primary.length > 3 && (
              <Badge className="text-xs bg-slate-800 text-slate-400">
                +{template.weapons.primary.length - 3}
              </Badge>
            )}
          </div>
        </div>

        {/* Artifact Sets */}
        <div className="mb-3">
          <div className="text-xs text-slate-500 mb-1">Artifact Sets</div>
          <div className="flex flex-wrap gap-1">
            {template.artifacts.sets[0]?.map((set) => (
              <Badge key={set.setKey} className="text-xs bg-slate-700 text-slate-200">
                {set.pieces}pc {set.setKey.replace(/([A-Z])/g, ' $1').trim()}
              </Badge>
            ))}
          </div>
        </div>

        {/* Main Stats */}
        {!compact && (
          <div className="mb-3">
            <div className="text-xs text-slate-500 mb-1">Main Stats</div>
            <div className="flex flex-wrap gap-1 text-xs text-slate-300">
              <span>
                <span className="text-slate-500">Sands:</span>{' '}
                {template.artifacts.mainStats.sands.slice(0, 2).join(' / ')}
              </span>
              <span className="text-slate-600">|</span>
              <span>
                <span className="text-slate-500">Goblet:</span>{' '}
                {template.artifacts.mainStats.goblet.slice(0, 2).join(' / ')}
              </span>
              <span className="text-slate-600">|</span>
              <span>
                <span className="text-slate-500">Circlet:</span>{' '}
                {template.artifacts.mainStats.circlet.slice(0, 2).join(' / ')}
              </span>
            </div>
          </div>
        )}

        {/* Substats */}
        {!compact && (
          <div className="mb-3">
            <div className="text-xs text-slate-500 mb-1">Substat Priority</div>
            <div className="text-xs text-slate-300">
              {template.artifacts.substats.slice(0, 4).join(' > ')}
            </div>
          </div>
        )}

        {/* Talent Priority */}
        {!compact && template.leveling.talentPriority && (
          <div className="mb-3">
            <div className="text-xs text-slate-500 mb-1">Talent Priority</div>
            <div className="text-xs text-slate-300">
              {template.leveling.talentPriority.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(' > ')}
            </div>
          </div>
        )}

        {/* Metadata Badges */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-700/50">
          <Badge className={`text-xs ${difficultyColors[template.difficulty]}`}>
            {template.difficulty}
          </Badge>
          <Badge className={`text-xs ${budgetColors[template.budget]}`}>
            {template.budget}
          </Badge>
          {template.source && (
            <Badge className="text-xs bg-slate-700 text-slate-300">{template.source}</Badge>
          )}
        </div>

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {template.tags.map((tag) => (
              <span key={tag} className="text-xs text-slate-500">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
