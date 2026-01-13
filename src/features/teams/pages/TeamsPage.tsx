import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Download, Users, Zap, Edit2, Trash2, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { TeamCardSkeleton } from '@/components/ui/Skeleton';
import { useTeams } from '@/features/roster/hooks/useTeams';
import { useCharacters } from '@/features/roster/hooks/useCharacters';
import TeamForm from '@/features/roster/components/TeamForm';
import { WfpsimExportModal } from '@/features/teams';
import type { Team, Character } from '@/types';

export default function TeamsPage() {
  const { teams, isLoading: teamsLoading, createTeam, updateTeam, deleteTeam } = useTeams();
  const { characters, isLoading: charsLoading } = useCharacters();

  // Modal state
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [wfpsimTeam, setWfpsimTeam] = useState<Team | null>(null);

  const isLoading = teamsLoading || charsLoading;

  const characterByKey = useMemo(() => {
    const map = new Map<string, Character>();
    characters.forEach((char) => {
      map.set(char.key.toLowerCase(), char);
    });
    return map;
  }, [characters]);

  const handleCreateTeam = useCallback(() => {
    setEditingTeam(null);
    setShowTeamModal(true);
  }, []);

  const handleEditTeam = useCallback((team: Team) => {
    setEditingTeam(team);
    setShowTeamModal(true);
  }, []);

  const handleCloseTeamModal = useCallback(() => {
    setShowTeamModal(false);
    setEditingTeam(null);
  }, []);

  const handleSaveTeam = useCallback(async (teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTeam) {
      await updateTeam(editingTeam.id, teamData);
    } else {
      await createTeam(teamData);
    }
    handleCloseTeamModal();
  }, [editingTeam, createTeam, updateTeam, handleCloseTeamModal]);

  const handleConfirmDelete = useCallback(async () => {
    if (deletingTeam) {
      await deleteTeam(deletingTeam.id);
      setDeletingTeam(null);
    }
  }, [deletingTeam, deleteTeam]);

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Teams</h1>
            <p className="text-slate-400">Manage team compositions and track progress</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <TeamCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Teams</h1>
          <p className="text-slate-400">
            {teams.length} team{teams.length !== 1 ? 's' : ''} • Click a team to view details
          </p>
        </div>
        <Button variant="primary" onClick={handleCreateTeam}>
          <Plus className="w-4 h-4" />
          New Team
        </Button>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">No teams yet</p>
            <p className="text-slate-500 text-sm mb-4">
              Create your first team to start planning builds and tracking materials
            </p>
            <Button variant="primary" onClick={handleCreateTeam}>
              <Plus className="w-4 h-4" />
              Create Team
            </Button>
          </CardContent>
        </Card>
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
                onEdit={() => handleEditTeam(team)}
                onDelete={() => setDeletingTeam(team)}
                onExport={() => setWfpsimTeam(team)}
              />
            );
          })}
        </div>
      )}

      {/* Team Create/Edit Modal */}
      <Modal
        isOpen={showTeamModal}
        onClose={handleCloseTeamModal}
        title={editingTeam ? 'Edit Team' : 'Create Team'}
      >
        <TeamForm
          initialData={editingTeam ?? undefined}
          characters={characters}
          onSubmit={handleSaveTeam}
          onCancel={handleCloseTeamModal}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingTeam}
        onClose={() => setDeletingTeam(null)}
        title="Delete Team"
      >
        <div className="space-y-4">
          <p className="text-slate-300">
            Are you sure you want to delete <strong>{deletingTeam?.name}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeletingTeam(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Wfpsim Export Modal */}
      {wfpsimTeam && (
        <WfpsimExportModal
          isOpen={!!wfpsimTeam}
          onClose={() => setWfpsimTeam(null)}
          team={wfpsimTeam}
          characters={wfpsimTeam.characterKeys
            .map((key) => characterByKey.get(key.toLowerCase()))
            .filter(Boolean) as Character[]}
        />
      )}
    </div>
  );
}

interface TeamCardProps {
  team: Team;
  members: Character[];
  onEdit: () => void;
  onDelete: () => void;
  onExport: () => void;
}

function TeamCard({ team, members, onEdit, onDelete, onExport }: TeamCardProps) {
  return (
    <Card className="hover:border-slate-700 transition-colors">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-100 truncate">{team.name}</h3>
            <p className="text-sm text-slate-500">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onExport(); }}
              className="p-1.5 text-yellow-400 hover:bg-yellow-400/10 rounded transition-colors"
              title="Export to wfpsim"
            >
              <Zap className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Edit team"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
              title="Delete team"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Members */}
        <div className="flex gap-2 mb-3">
          {members.length > 0 ? (
            members.map((char, idx) => (
              <div
                key={char.id}
                className="flex-1 bg-slate-800 rounded-lg p-2 text-center"
              >
                <div className="text-xs font-medium text-slate-300 truncate">
                  {char.key}
                </div>
                <div className="text-xs text-slate-500">
                  Lv.{char.level}
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 bg-slate-800 rounded-lg p-3 text-center text-slate-500 text-sm">
              No members
            </div>
          )}
        </div>

        {/* Tags */}
        {team.tags && team.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {team.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="default" className="text-xs">
                {tag}
              </Badge>
            ))}
            {team.tags.length > 3 && (
              <Badge variant="default" className="text-xs">
                +{team.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* View Details Link */}
        <Link
          to={`/teams/${team.id}`}
          className="flex items-center justify-center gap-2 w-full py-2 mt-2 text-sm text-primary-400 hover:text-primary-300 hover:bg-primary-400/10 rounded-lg transition-colors"
        >
          View Details
          <ChevronRight className="w-4 h-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
