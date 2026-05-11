import { Link } from 'react-router-dom';
import { ChevronRight, Pencil, Trash2, Users, Zap, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { Character, Team } from '@/types';
import { MAX_LEVEL_BY_ASCENSION } from '@/lib/constants';
import { buildTeamCampaignUrl } from '@/features/campaigns/lib/campaignLinks';

interface TeamCardProps {
  team: Team;
  members: Character[];
  onEdit?: (team: Team) => void;
  onDelete?: (team: Team) => void;
  onExportToWfpsim?: (team: Team) => void;
  /** Show link to create a team target. */
  showPlannerLink?: boolean;
  showDetailsLink?: boolean;
}

export default function TeamCard({
  team,
  members,
  onEdit,
  onDelete,
  onExportToWfpsim,
  showPlannerLink = true,
  showDetailsLink = true,
}: TeamCardProps) {
  const plannerUrl = buildTeamCampaignUrl(team.id);
  const memberLabel = `${members.length} member${members.length === 1 ? '' : 's'}`;

  return (
    <Card className="relative h-full">
      <div className="absolute top-3 right-3 flex items-center gap-1">
        {showPlannerLink && team.characterKeys.length > 0 && (
          <Link
            to={plannerUrl}
            className="p-1.5 bg-green-700 hover:bg-green-600 rounded-md transition-colors"
            title="Start team target"
            aria-label="Start team target"
          >
            <Calendar className="w-4 h-4 text-white" aria-hidden="true" />
          </Link>
        )}
        {onExportToWfpsim && (
          <button
            onClick={() => onExportToWfpsim(team)}
            className="p-1.5 bg-primary-700 hover:bg-primary-600 rounded-md transition-colors"
            title="Export to wfpsim"
            aria-label="Export to wfpsim"
          >
            <Zap className="w-4 h-4 text-white" aria-hidden="true" />
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(team)}
            className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
            title="Edit team"
            aria-label="Edit team"
          >
            <Pencil className="w-4 h-4 text-slate-200" aria-hidden="true" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(team)}
            className="p-1.5 bg-red-700 hover:bg-red-600 rounded-md transition-colors"
            title="Delete team"
            aria-label="Delete team"
          >
            <Trash2 className="w-4 h-4 text-white" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start gap-2 pr-32">
          <Users className="mt-1 w-4 h-4 flex-shrink-0 text-primary-400" aria-hidden="true" />
          <div>
            <h3 className="text-lg font-semibold text-slate-100">{team.name}</h3>
            <p className="text-xs text-slate-500">
              {memberLabel} • Updated {new Date(team.updatedAt).toLocaleDateString()}
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

        {showDetailsLink && (
          <Link
            to={`/roster/teams/${team.id}`}
            className="flex items-center justify-center gap-2 rounded-lg py-2 text-sm text-primary-400 transition-colors hover:bg-primary-400/10 hover:text-primary-300"
          >
            View Details
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </Card>
  );
}
