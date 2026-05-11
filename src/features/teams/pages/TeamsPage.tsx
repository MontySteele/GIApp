import { useState, useMemo, useCallback } from 'react';
import { Download, Plus, Users } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { TeamCardSkeleton } from '@/components/ui/Skeleton';
import { useTeams } from '@/features/roster/hooks/useTeams';
import { useCharacters } from '@/features/roster/hooks/useCharacters';
import TeamForm from '@/features/roster/components/TeamForm';
import TeamCard from '@/features/roster/components/TeamCard';
import TeamSnapshotExport from '@/features/roster/components/TeamSnapshotExport';
import { WfpsimExportModal } from '@/features/teams';
import type { Team, Character } from '@/types';

export default function TeamsPage() {
  const { teams, isLoading: teamsLoading, createTeam, updateTeam, deleteTeam } = useTeams();
  const { characters, isLoading: charsLoading } = useCharacters();

  // Modal state
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
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
        <div className="flex items-center gap-2">
          {teams.length > 0 && (
            <Button variant="ghost" onClick={() => setShowExportModal(true)} aria-label="Export teams">
              <Download className="w-4 h-4" aria-hidden="true" />
              Export Teams
            </Button>
          )}
          <Button variant="primary" onClick={handleCreateTeam}>
            <Plus className="w-4 h-4" />
            New Team
          </Button>
        </div>
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
                onEdit={handleEditTeam}
                onDelete={setDeletingTeam}
                onExportToWfpsim={setWfpsimTeam}
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

      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Teams"
        size="lg"
      >
        <TeamSnapshotExport onClose={() => setShowExportModal(false)} />
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
