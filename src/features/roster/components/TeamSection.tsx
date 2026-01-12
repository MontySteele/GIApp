import { useMemo } from 'react';
import { Plus, Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import { TeamCardSkeleton } from '@/components/ui/Skeleton';
import TeamCard from './TeamCard';
import type { Character, Team } from '@/types';

interface TeamSectionProps {
  teams: Team[];
  allCharacters: Character[];
  isLoading: boolean;
  onCreateTeam: () => void;
  onEditTeam: (team: Team) => void;
  onDeleteTeam: (team: Team) => void;
  onExportTeams: () => void;
  onExportToWfpsim?: (team: Team) => void;
}

export default function TeamSection({
  teams,
  allCharacters,
  isLoading,
  onCreateTeam,
  onEditTeam,
  onDeleteTeam,
  onExportTeams,
  onExportToWfpsim,
}: TeamSectionProps) {
  const characterByKey = useMemo(() => {
    const map = new Map<string, Character>();
    allCharacters.forEach((char) => {
      map.set(char.key.toLowerCase(), char);
    });
    return map;
  }, [allCharacters]);

  return (
    <section className="mb-8" aria-labelledby="teams-heading">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 id="teams-heading" className="text-2xl font-semibold">Teams</h2>
          <p className="text-slate-400">Create squads and keep character links in sync.</p>
        </div>
        <div className="flex items-center gap-2">
          {teams.length > 0 && (
            <Button variant="ghost" onClick={onExportTeams} aria-label="Export teams">
              <Download className="w-4 h-4" aria-hidden="true" />
              Export Teams
            </Button>
          )}
          <Button variant="secondary" onClick={onCreateTeam}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            New Team
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <TeamCardSkeleton key={i} />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-slate-400">
          No teams yet. Build your first team to keep rotations organized.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {teams.map((team) => {
            const members = team.characterKeys
              .map((key) => characterByKey.get(key.toLowerCase()))
              .filter(Boolean) as Character[];

            return (
              <TeamCard
                key={team.id}
                team={team}
                members={members}
                onEdit={onEditTeam}
                onDelete={onDeleteTeam}
                onExportToWfpsim={onExportToWfpsim}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
