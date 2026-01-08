import { Pencil, Trash2, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { Character, Team } from '@/types';
import { MAX_LEVEL_BY_ASCENSION } from '@/lib/constants';

interface TeamCardProps {
  team: Team;
  members: Character[];
  onEdit?: (team: Team) => void;
  onDelete?: (team: Team) => void;
}

export default function TeamCard({ team, members, onEdit, onDelete }: TeamCardProps) {
  return (
    <Card className="relative">
      <div className="absolute top-3 right-3 flex items-center gap-1">
        {onEdit && (
          <button
            onClick={() => onEdit(team)}
            className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
            title="Edit team"
          >
            <Pencil className="w-4 h-4 text-slate-200" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(team)}
            className="p-1.5 bg-red-700 hover:bg-red-600 rounded-md transition-colors"
            title="Delete team"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary-400" />
          <div>
            <h3 className="text-lg font-semibold text-slate-100">{team.name}</h3>
            <p className="text-xs text-slate-500">
              Updated {new Date(team.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {team.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {team.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="capitalize">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div>
          <div className="text-sm text-slate-400 mb-2">Rotation Order</div>
          {team.characterKeys.length === 0 ? (
            <p className="text-sm text-slate-500">No characters assigned yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {team.characterKeys.map((key, index) => {
                const member = members.find((char) => char.key.toLowerCase() === key.toLowerCase());

                return (
                  <div
                    key={`${team.id}-${key}-${index}`}
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800"
                  >
                    <div className="text-xs text-slate-500">#{index + 1}</div>
                    <div className="text-sm font-medium text-slate-100">{member?.key ?? key}</div>
                    {member && (
                      <div className="text-xs text-slate-500">
                        Lv. {member.level}/{MAX_LEVEL_BY_ASCENSION[member.ascension] ?? 90} • {member.priority}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {team.rotationNotes && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-500 mb-1">Notes</div>
            <p className="text-sm text-slate-300 whitespace-pre-line line-clamp-3">{team.rotationNotes}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
